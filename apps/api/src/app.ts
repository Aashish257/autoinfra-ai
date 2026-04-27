import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './config/db.js';
import redis from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import deploymentRoutes from './routes/deployment.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import healingRoutes from './routes/healing.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/deployments', healingRoutes);
app.use(errorHandler);

// Health check
app.get('/health', async (_req, res) => {
    try {
        await prisma.$executeRaw`SELECT 1`;
        const redisPing = await redis.ping();

        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                postgres: 'up',
                redis: redisPing === 'PONG' ? 'up' : 'down',
            },
        });
    } catch (err) {
        res.status(503).json({
            status: 'degraded',
            services: { postgres: 'down', redis: 'unknown' },
            error: String(err),
        });
    }
});

export default app;
