import { prisma } from '../config/db.js';
import { getCache, setCache, deleteCache } from '../config/cache.js';
import type { CreateDeploymentInput, UpdateDeploymentInput } from '../validators/deployment.validator.js';
import * as K8sService from './k8s.service.js';

const CACHE_TTL = 30; // seconds

// ── Create ────────────────────────────────────────────────
export async function createDeployment(userId: string, input: CreateDeploymentInput) {
    const existing = await prisma.deployment.findFirst({
        where: { name: input.name, userId },
    });
    if (existing) throw new Error('DEPLOYMENT_NAME_TAKEN');

    const deployment = await prisma.deployment.create({
        data: { ...input, userId },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    await deleteCache(`deployments:user:${userId}`); // invalidate list cache
    return deployment;
}

// ── Get all (user scoped) ─────────────────────────────────
export async function getUserDeployments(userId: string, role: string) {
    const cacheKey = `deployments:user:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // Admins see all, others see own
    const where = role === 'ADMIN' ? {} : { userId };

    const deployments = await prisma.deployment.findMany({
        where,
        include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { healingEvents: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    await setCache(cacheKey, deployments, CACHE_TTL);
    return deployments;
}

// ── Get one ───────────────────────────────────────────────
export async function getDeploymentById(id: string, userId: string, role: string) {
    const cacheKey = `deployment:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const deployment = await prisma.deployment.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            healingEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
            metrics: { orderBy: { recordedAt: 'desc' }, take: 20 },
        },
    });

    if (!deployment) throw new Error('NOT_FOUND');

    // Non-admin can only see own
    if (role !== 'ADMIN' && deployment.userId !== userId) {
        throw new Error('FORBIDDEN');
    }

    await setCache(cacheKey, deployment, CACHE_TTL);
    return deployment;
}

// ── Update ────────────────────────────────────────────────
export async function updateDeployment(
    id: string,
    userId: string,
    role: string,
    input: UpdateDeploymentInput
) {
    const deployment = await prisma.deployment.findUnique({ where: { id } });
    if (!deployment) throw new Error('NOT_FOUND');
    if (role !== 'ADMIN' && deployment.userId !== userId) throw new Error('FORBIDDEN');

    const updated = await prisma.deployment.update({
        where: { id },
        data: input as any,
    });

    await deleteCache(`deployment:${id}`);
    await deleteCache(`deployments:user:${userId}`);
    return updated;
}

// ── Delete ────────────────────────────────────────────────
export async function deleteDeployment(id: string, userId: string, role: string) {
    const deployment = await prisma.deployment.findUnique({ where: { id } });
    if (!deployment) throw new Error('NOT_FOUND');
    if (role !== 'ADMIN' && deployment.userId !== userId) throw new Error('FORBIDDEN');

    await prisma.deployment.delete({ where: { id } });
    await deleteCache(`deployment:${id}`);
    await deleteCache(`deployments:user:${userId}`);
}

// ── Simulate deploy (mock k8s call) ──────────────────────
export async function triggerDeploy(id: string, userId: string, role: string) {
    const deployment = await prisma.deployment.findUnique({ where: { id } });
    if (!deployment) throw new Error('NOT_FOUND');
    if (role !== 'ADMIN' && deployment.userId !== userId) throw new Error('FORBIDDEN');

    // Create real k8s deployment
    await K8sService.createK8sDeployment({
        name: deployment.name,
        namespace: deployment.namespace,
        imageTag: deployment.imageTag,
        replicas: deployment.replicas,
    });

    const updated = await prisma.deployment.update({
        where: { id },
        data: { status: 'RUNNING' },
    });

    // Seed initial metric
    await prisma.deploymentMetric.create({
        data: {
            deploymentId: id,
            cpuUsage: 0,
            memUsage: 0,
            podCount: deployment.replicas,
            errorRate: 0,
        },
    });

    await deleteCache(`deployment:${id}`);
    return updated;
}