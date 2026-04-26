import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();

if (process.env.NODE_ENV === 'production') {
    // Inside cluster (real pod) — uses mounted service account
    kc.loadFromCluster();
} else {
    // Local dev — uses ~/.kube/config
    kc.loadFromDefault();
}

export const k8sAppsV1 = kc.makeApiClient(k8s.AppsV1Api);
export const k8sCoreV1 = kc.makeApiClient(k8s.CoreV1Api);
export const k8sConfig = kc;