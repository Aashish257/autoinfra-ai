import type { Request, Response } from 'express';
import * as HealingService from '../services/healing.service.js';
import { prisma } from '../config/db.js';

// Manual trigger heal check on one deployment
export async function triggerCheck(req: Request, res: Response) {
    try {
        const result = await HealingService.runHealthCheck(req.params.id as string);
        return res.status(200).json(result);
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
        return res.status(500).json({ error: 'Health check failed' });
    }
}

// Inject metric snapshot (simulate real Prometheus push)
export async function injectMetric(req: Request, res: Response) {
    const { cpuUsage, memUsage, podCount, errorRate } = req.body;

    if (
        cpuUsage === undefined || memUsage === undefined ||
        podCount === undefined || errorRate === undefined
    ) {
        return res.status(400).json({ error: 'All metric fields required' });
    }

    try {
        const metric = await prisma.deploymentMetric.create({
            data: {
                deploymentId: req.params.id as string,
                cpuUsage, memUsage, podCount, errorRate,
            },
        });
        return res.status(201).json(metric);
    } catch {
        return res.status(500).json({ error: 'Failed to inject metric' });
    }
}

// Get healing history for a deployment
export async function getHealingEvents(req: Request, res: Response) {
    try {
        const events = await prisma.healingEvent.findMany({
            where: { deploymentId: req.params.id as string },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(events);
    } catch {
        return res.status(500).json({ error: 'Failed to fetch healing events' });
    }
}

// Global check across all deployments (called by cron)
export async function globalCheck(_req: Request, res: Response) {
    try {
        const results = await HealingService.runGlobalHealthCheck();
        return res.status(200).json(results);
    } catch {
        return res.status(500).json({ error: 'Global health check failed' });
    }
}