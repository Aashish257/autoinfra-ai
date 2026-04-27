pipeline {
    agent any

    environment {
        // Updated to use GHCR for consistency with our previous fixes
        DOCKER_REGISTRY  = 'ghcr.io'
        IMAGE_OWNER      = 'aashish257'
        API_IMAGE        = "ghcr.io/aashish257/autoinfra-api"
        WEB_IMAGE        = "ghcr.io/aashish257/autoinfra-web"
        K8S_NAMESPACE    = 'autoinfra'
        DEPLOY_TIMEOUT   = '300'
    }

    parameters {
        string(
            name: 'IMAGE_TAG',
            defaultValue: 'latest',
            description: 'Docker image tag to deploy'
        )
    }

    stages {
        // ── Stage 1: Validate ──────────────────────────────
        stage('Validate') {
            steps {
                echo "Deploying image tag: ${params.IMAGE_TAG}"
                echo "Target namespace: ${env.K8S_NAMESPACE}"
                sh 'docker --version'
                sh 'kubectl version --client'
            }
        }

        // ── Stage 2: Pull Images ───────────────────────────
        stage('Pull Images') {
            steps {
                // Using GITHUB_TOKEN for GHCR authentication
                withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
                    sh '''
                        echo $GH_TOKEN | docker login ghcr.io -u aashish257 --password-stdin
                        docker pull ${API_IMAGE}:${IMAGE_TAG}
                        docker pull ${WEB_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        // ── Stage 3: Deploy to Kubernetes ─────────────────
        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        # Update API image
                        kubectl set image deployment/autoinfra-api \
                            api=${API_IMAGE}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE}

                        # Update Web image
                        kubectl set image deployment/autoinfra-web \
                            web=${WEB_IMAGE}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE}

                        # Wait for rollout
                        kubectl rollout status deployment/autoinfra-api \
                            -n ${K8S_NAMESPACE} \
                            --timeout=${DEPLOY_TIMEOUT}s

                        kubectl rollout status deployment/autoinfra-web \
                            -n ${K8S_NAMESPACE} \
                            --timeout=${DEPLOY_TIMEOUT}s
                    '''
                }
            }
        }

        // ── Stage 4: Health Check ──────────────────────────
        stage('Health Check') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        echo "Checking pod status..."
                        kubectl get pods -n ${K8S_NAMESPACE}

                        # Verify minimum ready pods
                        READY=$(kubectl get deployment autoinfra-api \
                            -n ${K8S_NAMESPACE} \
                            -o jsonpath="{.status.readyReplicas}")

                        echo "Ready replicas: $READY"

                        if [ "$READY" -lt "1" ]; then
                            echo "DEPLOY FAILED: No ready replicas"
                            exit 1
                        fi

                        echo "Health check passed"
                    '''
                }
            }
        }

        // ── Stage 5: Smoke Test ────────────────────────────
        stage('Smoke Test') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        # Port-forward temporarily for smoke test
                        kubectl port-forward svc/autoinfra-api 5001:5000 \
                            -n ${K8S_NAMESPACE} &
                        PF_PID=$!

                        sleep 10

                        # Hit health endpoint
                        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
                            http://localhost:5001/health)

                        kill $PF_PID

                        if [ "$RESPONSE" != "200" ]; then
                            echo "SMOKE TEST FAILED: Got HTTP $RESPONSE"
                            exit 1
                        fi

                        echo "Smoke test passed: HTTP $RESPONSE"
                    '''
                }
            }
        }

        // ── Stage 6: Trigger Self-Heal Check ──────────────
        stage('Trigger Heal Check') {
            steps {
                sh '''
                    echo "Notifying AutoInfra AI of new deployment..."
                    curl -s -X POST http://localhost:5001/api/deployments/global-check \
                        -H "Content-Type: application/json" || true
                '''
            }
        }
    }

    // ── Post actions ───────────────────────────────────────
    post {
        success {
            echo "Deployment successful: ${API_IMAGE}:${params.IMAGE_TAG}"
        }
        failure {
            echo "Deployment FAILED — triggering rollback"
            withCredentials([file(
                credentialsId: 'kubeconfig',
                variable: 'KUBECONFIG'
            )]) {
                sh '''
                    kubectl rollout undo deployment/autoinfra-api \
                        -n ${K8S_NAMESPACE} || true
                    kubectl rollout undo deployment/autoinfra-web \
                        -n ${K8S_NAMESPACE} || true
                    echo "Rollback complete"
                '''
            }
        }
        always {
            cleanWs()
        }
    }
}
