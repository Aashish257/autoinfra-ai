import { z } from 'zod';

export const createDeploymentSchema = z.object({
    name: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, {
        message: 'Lowercase letters, numbers, hyphens only',
    }),
    imageTag: z.string().min(1),
    environment: z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']),
    replicas: z.number().int().min(1).max(20).default(1),
    namespace: z.string().default('default'),
});

export const updateDeploymentSchema = z.object({
    replicas: z.number().int().min(1).max(20).optional(),
    imageTag: z.string().optional(),
    status: z.enum(['PENDING', 'RUNNING', 'FAILED', 'HEALING', 'ROLLED_BACK']).optional(),
});

export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
export type UpdateDeploymentInput = z.infer<typeof updateDeploymentSchema>;