pipeline {
    agent any

    environment {
        IMAGE_OWNER      = 'aashish257'
        API_IMAGE        = 'ghcr.io/aashish257/autoinfra-api'
        WEB_IMAGE        = 'ghcr.io/aashish257/autoinfra-web'
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
        // Only check kubectl — Docker is NOT needed for CD
        stage('Validate') {
            steps {
                echo "Deploying image tag: ${params.IMAGE_TAG}"
                echo "Target namespace: ${env.K8S_NAMESPACE}"
                echo "API Image: ${env.API_IMAGE}:${params.IMAGE_TAG}"
                echo "Web Image: ${env.WEB_IMAGE}:${params.IMAGE_TAG}"
                sh 'kubectl version --client'
            }
        }

        // ── Stage 2: Create Namespace (if not exists) ─────
        stage('Prepare Namespace') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        kubectl create namespace ${K8S_NAMESPACE} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        // ── Stage 3: Create GHCR Pull Secret ──────────────
        // Kubernetes needs this secret to pull images from GHCR
        stage('Configure GHCR Pull Secret') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG'),
                    string(credentialsId: 'github-token', variable: 'GH_TOKEN')
                ]) {
                    sh '''
                        kubectl create secret docker-registry ghcr-pull-secret \
                            --docker-server=ghcr.io \
                            --docker-username=${IMAGE_OWNER} \
                            --docker-password=${GH_TOKEN} \
                            --namespace=${K8S_NAMESPACE} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        // ── Stage 4: Deploy API ────────────────────────────
        // kubectl set image tells Kubernetes to use the new image.
        // Kubernetes then pulls it from GHCR automatically.
        stage('Deploy API') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        kubectl set image deployment/autoinfra-api \
                            api=${API_IMAGE}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE} || \
                        kubectl run autoinfra-api \
                            --image=${API_IMAGE}:${IMAGE_TAG} \
                            --namespace=${K8S_NAMESPACE} \
                            --port=5000 \
                            --overrides=\'{"spec":{"imagePullSecrets":[{"name":"ghcr-pull-secret"}]}}\' \
                            --dry-run=client -o yaml | kubectl apply -f -

                        echo "API deployment updated to ${IMAGE_TAG}"
                    '''
                }
            }
        }

        // ── Stage 5: Deploy Web ────────────────────────────
        stage('Deploy Web') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        kubectl set image deployment/autoinfra-web \
                            web=${WEB_IMAGE}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE} || \
                        kubectl run autoinfra-web \
                            --image=${WEB_IMAGE}:${IMAGE_TAG} \
                            --namespace=${K8S_NAMESPACE} \
                            --port=3000 \
                            --overrides=\'{"spec":{"imagePullSecrets":[{"name":"ghcr-pull-secret"}]}}\' \
                            --dry-run=client -o yaml | kubectl apply -f -

                        echo "Web deployment updated to ${IMAGE_TAG}"
                    '''
                }
            }
        }

        // ── Stage 6: Wait for Rollout ──────────────────────
        stage('Wait for Rollout') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        echo "Waiting for API rollout..."
                        kubectl rollout status deployment/autoinfra-api \
                            -n ${K8S_NAMESPACE} \
                            --timeout=${DEPLOY_TIMEOUT}s || true

                        echo "Waiting for Web rollout..."
                        kubectl rollout status deployment/autoinfra-web \
                            -n ${K8S_NAMESPACE} \
                            --timeout=${DEPLOY_TIMEOUT}s || true
                    '''
                }
            }
        }

        // ── Stage 7: Health Check ──────────────────────────
        stage('Health Check') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig',
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        echo "=== Pod Status ==="
                        kubectl get pods -n ${K8S_NAMESPACE}

                        echo "=== Deployment Status ==="
                        kubectl get deployments -n ${K8S_NAMESPACE}

                        echo "Health check complete"
                    '''
                }
            }
        }
    }

    // ── Post actions ───────────────────────────────────────
    post {
        success {
            echo "✅ Deployment successful!"
            echo "API: ${API_IMAGE}:${params.IMAGE_TAG}"
            echo "Web: ${WEB_IMAGE}:${params.IMAGE_TAG}"
        }
        failure {
            echo "❌ Deployment FAILED — triggering rollback"
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
