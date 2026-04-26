import type { Request, Response } from 'express';
import { createDeploymentSchema, updateDeploymentSchema } from '../validators/deployment.validator.js';
import * as DeploymentService from '../services/deployment.service.js';
import * as K8sService from '../services/k8s.service.js';
import { prisma } from '../config/db.js';

export async function create(req: Request, res: Response) {
    const parsed = createDeploymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
        const result = await DeploymentService.createDeployment(req.user!.userId, parsed.data);
        return res.status(201).json(result);
    } catch (err: any) {
        if (err.message === 'DEPLOYMENT_NAME_TAKEN') {
            return res.status(409).json({ error: 'Deployment name already exists' });
        }
        return res.status(500).json({ error: 'Failed to create deployment' });
    }
}

export async function getAll(req: Request, res: Response) {
    try {
        const result = await DeploymentService.getUserDeployments(
            req.user!.userId,
            req.user!.role
        );
        return res.status(200).json(result);
    } catch {
        return res.status(500).json({ error: 'Failed to fetch deployments' });
    }
}

export async function getOne(req: Request, res: Response) {
    try {
        const result = await DeploymentService.getDeploymentById(
            req.params.id as string,
            req.user!.userId,
            req.user!.role
        );
        return res.status(200).json(result);
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
        if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });
        return res.status(500).json({ error: 'Failed to fetch deployment' });
    }
}

export async function update(req: Request, res: Response) {
    const parsed = updateDeploymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
        const result = await DeploymentService.updateDeployment(
            req.params.id as string,
            req.user!.userId,
            req.user!.role,
            parsed.data
        );
        return res.status(200).json(result);
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
        if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });
        return res.status(500).json({ error: 'Failed to update deployment' });
    }
}

export async function remove(req: Request, res: Response) {
    try {
        await DeploymentService.deleteDeployment(
            req.params.id as string,
            req.user!.userId,
            req.user!.role
        );
        return res.status(204).send();
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
        if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });
        return res.status(500).json({ error: 'Failed to delete deployment' });
    }
}

export async function deploy(req: Request, res: Response) {
    try {
        const result = await DeploymentService.triggerDeploy(
            req.params.id as string,
            req.user!.userId,
            req.user!.role
        );
        return res.status(200).json(result);
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
        if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });
        return res.status(500).json({ error: 'Failed to trigger deployment' });
    }
}

export async function getPods(req: Request, res: Response) {
    try {
        const deployment = await prisma.deployment.findUnique({
            where: { id: req.params.id as string },
        });
        if (!deployment) return res.status(404).json({ error: 'Not found' });

        const pods = await K8sService.getDeploymentPods(
            deployment.name,
            deployment.namespace
        );
        return res.status(200).json(pods);
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to fetch pods' });
    }
}

export async function getK8sStatus(req: Request, res: Response) {
    try {
        const deployment = await prisma.deployment.findUnique({
            where: { id: req.params.id as string },
        });
        if (!deployment) return res.status(404).json({ error: 'Not found' });

        const status = await K8sService.getDeploymentStatus(
            deployment.name,
            deployment.namespace
        );
        return res.status(200).json(status);
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to fetch k8s status' });
    }
}

export async function getClusterStatus(req: Request, res: Response) {
    try {
        const nodes = await K8sService.getNodes();
        const pods = await K8sService.getAllPods();
        return res.status(200).json({ nodes, pods });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to fetch cluster status' });
    }
}