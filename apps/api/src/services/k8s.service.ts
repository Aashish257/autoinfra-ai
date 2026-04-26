import * as k8s from '@kubernetes/client-node';
import { k8sAppsV1, k8sCoreV1 } from '../config/k8s.js';

// ── Create Deployment ─────────────────────────────────────
export async function createK8sDeployment(opts: {
    name: string;
    namespace: string;
    imageTag: string;
    replicas: number;
}) {
    const manifest: k8s.V1Deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: opts.name,
            namespace: opts.namespace,
            labels: { app: opts.name, 'managed-by': 'autoinfra-ai' },
        },
        spec: {
            replicas: opts.replicas,
            selector: { matchLabels: { app: opts.name } },
            template: {
                metadata: { labels: { app: opts.name } },
                spec: {
                    containers: [
                        {
                            name: opts.name,
                            image: opts.imageTag,
                            ports: [{ containerPort: 80 }],
                            resources: {
                                requests: { cpu: '100m', memory: '128Mi' },
                                limits: { cpu: '500m', memory: '512Mi' },
                            },
                            livenessProbe: {
                                httpGet: { path: '/health', port: 80 as any },
                                initialDelaySeconds: 10,
                                periodSeconds: 10,
                            },
                            readinessProbe: {
                                httpGet: { path: '/health', port: 80 as any },
                                initialDelaySeconds: 5,
                                periodSeconds: 5,
                            },
                        },
                    ],
                },
            },
        },
    };

    const res = await k8sAppsV1.createNamespacedDeployment({
        namespace: opts.namespace,
        body: manifest,
    });
    return res;
}

// ── Scale Deployment ──────────────────────────────────────
export async function scaleDeployment(name: string, namespace: string, replicas: number) {
    const patch = [{ op: 'replace', path: '/spec/replicas', value: replicas }];

    const res = await k8sAppsV1.patchNamespacedDeployment({
        name,
        namespace,
        body: patch,
    });
    return res;
}

// ── Restart Deployment (rolling restart) ──────────────────
export async function restartDeployment(name: string, namespace: string) {
    const patch = {
        spec: {
            template: {
                metadata: {
                    annotations: {
                        'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
                    },
                },
            },
        },
    };

    const res = await k8sAppsV1.patchNamespacedDeployment({
        name,
        namespace,
        body: patch,
    });
    return res;
}

// ── Rollback (delete + recreate with prev tag) ────────────
export async function rollbackDeployment(opts: {
    name: string;
    namespace: string;
    previousImageTag: string;
    replicas: number;
}) {
    // Delete current
    await k8sAppsV1.deleteNamespacedDeployment({ name: opts.name, namespace: opts.namespace });

    // Wait briefly
    await new Promise((res) => setTimeout(res, 2000));

    // Recreate with previous image
    return createK8sDeployment({
        name: opts.name,
        namespace: opts.namespace,
        imageTag: opts.previousImageTag,
        replicas: opts.replicas,
    });
}

// ── Delete Deployment ─────────────────────────────────────
export async function deleteK8sDeployment(name: string, namespace: string) {
    await k8sAppsV1.deleteNamespacedDeployment({ name, namespace });
}

// ── Get Pod list for deployment ───────────────────────────
export async function getDeploymentPods(name: string, namespace: string) {
    const res = await k8sCoreV1.listNamespacedPod({
        namespace,
        labelSelector: `app=${name}`,
    });
    return res.items.map((pod: any) => ({
        name: pod.metadata?.name,
        phase: pod.status?.phase,
        ready: pod.status?.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True',
        restartCount: pod.status?.containerStatuses?.[0]?.restartCount ?? 0,
        startedAt: pod.status?.startTime,
    }));
}

// ── Get real metrics from pods ────────────────────────────
export async function getDeploymentStatus(name: string, namespace: string) {
    const res = await k8sAppsV1.readNamespacedDeployment({ name, namespace });
    const spec = res.spec;
    const status = res.status;

    return {
        desiredReplicas: spec?.replicas ?? 0,
        readyReplicas: status?.readyReplicas ?? 0,
        availableReplicas: status?.availableReplicas ?? 0,
        updatedReplicas: status?.updatedReplicas ?? 0,
        conditions: status?.conditions ?? [],
    };
}

// ── Get All Nodes ─────────────────────────────────────────
export async function getNodes() {
    const res = await k8sCoreV1.listNode();
    return res.items.map((node: any) => ({
        name: node.metadata?.name,
        status: node.status?.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
        cpu: node.status?.capacity?.cpu,
        memory: node.status?.capacity?.memory,
    }));
}

// ── Get All Pods in Namespace ─────────────────────────────
export async function getAllPods() {
    const namespace = process.env.K8S_NAMESPACE || 'autoinfra';
    const res = await k8sCoreV1.listNamespacedPod({ namespace });
    return res.items.map((pod: any) => ({
        name: pod.metadata?.name,
        status: pod.status?.phase,
        restarts: pod.status?.containerStatuses?.[0]?.restartCount ?? 0,
        ip: pod.status?.podIP,
        age: pod.metadata?.creationTimestamp ? 
             Math.floor((Date.now() - new Date(pod.metadata.creationTimestamp).getTime()) / 60000) + 'm' : 'N/A'
    }));
}