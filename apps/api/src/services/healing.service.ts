import { prisma } from '../config/db.js';
import { deleteCache } from '../config/cache.js';
import { HEALING_RULES } from '../config/healing.config.js';
import * as K8sService from './k8s.service.js';

export interface MetricSnapshot {
    cpuUsage: number;
    memUsage: number;
    podCount: number;
    errorRate: number;
}

// ── Core: analyze metrics → decide action ─────────────────
export function analyzeMetrics(metrics: MetricSnapshot): {
    trigger: string;
    action: string;
} | null {
    if (metrics.podCount === 0) {
        return { trigger: HEALING_RULES.POD_CRASH.trigger, action: HEALING_RULES.POD_CRASH.action };
    }
    if (metrics.errorRate > HEALING_RULES.HIGH_ERROR_RATE.threshold) {
        return { trigger: HEALING_RULES.HIGH_ERROR_RATE.trigger, action: HEALING_RULES.HIGH_ERROR_RATE.action };
    }
    if (metrics.cpuUsage > HEALING_RULES.HIGH_CPU.threshold) {
        return { trigger: HEALING_RULES.HIGH_CPU.trigger, action: HEALING_RULES.HIGH_CPU.action };
    }
    if (metrics.memUsage > HEALING_RULES.HIGH_MEMORY.threshold) {
        return { trigger: HEALING_RULES.HIGH_MEMORY.trigger, action: HEALING_RULES.HIGH_MEMORY.action };
    }
    return null; // healthy
}

// ── Execute healing action ────────────────────────────────
export async function executeHealing(deploymentId: string, trigger: string, action: string) {
    // 1. Mark deployment as HEALING
    await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'HEALING' },
    });

    // 2. Log healing event
    const event = await prisma.healingEvent.create({
        data: { deploymentId, trigger, action, status: 'IN_PROGRESS' },
    });

    // 3. Execute action (mock — real k8s in Phase 6)
    try {
        const result = await dispatchAction(deploymentId, action);

        // 4. Mark resolved
        await prisma.healingEvent.update({
            where: { id: event.id },
            data: { status: 'RESOLVED', resolvedAt: new Date() },
        });

        await prisma.deployment.update({
            where: { id: deploymentId },
            data: { status: 'RUNNING' },
        });

        await deleteCache(`deployment:${deploymentId}`);
        return { event, result };

    } catch (err) {
        // 5. Mark failed
        await prisma.healingEvent.update({
            where: { id: event.id },
            data: { status: 'FAILED' },
        });

        await prisma.deployment.update({
            where: { id: deploymentId },
            data: { status: 'FAILED' },
        });

        throw err;
    }
}

// ── Run full check on one deployment ─────────────────────
export async function runHealthCheck(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });

    if (!deployment) throw new Error('NOT_FOUND');
    if (deployment.status === 'HEALING') {
        return { status: 'skipped', reason: 'Already healing' };
    }

    const latest = deployment.metrics[0];
    if (!latest) return { status: 'skipped', reason: 'No metrics available' };

    const decision = analyzeMetrics({
        cpuUsage: latest.cpuUsage,
        memUsage: latest.memUsage,
        podCount: latest.podCount,
        errorRate: latest.errorRate,
    });

    if (!decision) return { status: 'healthy', deploymentId };

    const result = await executeHealing(deploymentId, decision.trigger, decision.action);
    return { status: 'healed', decision, result };
}

// ── Run check on ALL active deployments (cron job) ────────
export async function runGlobalHealthCheck() {
    const deployments = await prisma.deployment.findMany({
        where: { status: { in: ['RUNNING', 'FAILED'] } },
        select: { id: true },
    });

    const results = await Promise.allSettled(
        deployments.map((d) => runHealthCheck(d.id))
    );

    return results.map((r, i) => ({
        deploymentId: deployments[i]?.id || 'unknown',
        result: r.status === 'fulfilled' ? r.value : { error: (r as PromiseRejectedResult).reason?.message },
    }));
}

// ── Action dispatcher (mock — swapped for k8s in Phase 6) ─
async function dispatchAction(deploymentId: string, action: string): Promise<string> {
    console.log(`[HEALING] Dispatching: ${action} → deployment: ${deploymentId}`);

    const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
    });
    if (!deployment) throw new Error('NOT_FOUND');

    const { name, namespace, replicas, imageTag } = deployment;

    switch (action) {
        case 'scale_up': {
            const newReplicas = replicas + 1;
            await K8sService.scaleDeployment(name, namespace, newReplicas);
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { replicas: newReplicas },
            });
            return `Scaled up to ${newReplicas} replicas`;
        }

        case 'restart_pod': {
            await K8sService.restartDeployment(name, namespace);
            return 'Rolling restart triggered';
        }

        case 'rollback': {
            // Use previous imageTag snapshot — simplified: use same tag with "-stable" suffix
            const previousTag = imageTag.includes(':') ? imageTag.split(':')[0] + ':stable' : imageTag + ':stable';
            await K8sService.rollbackDeployment({ name, namespace, previousImageTag: previousTag, replicas });
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { status: 'ROLLED_BACK' },
            });
            return `Rolled back to ${previousTag}`;
        }

        default:
            throw new Error(`Unknown action: ${action}`);
    }
}