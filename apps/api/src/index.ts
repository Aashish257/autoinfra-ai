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
import { startHealthCheckJob } from './jobs/healthCheck.job.js';

const app = express();
const PORT = process.env.PORT || 5000;

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
    console.log('Health check requested...');
    try {
        await prisma.$executeRaw`SELECT 1`;
        console.log('Postgres: up');
        const redisPing = await redis.ping();
        console.log('Redis:', redisPing === 'PONG' ? 'up' : 'down');

        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                postgres: 'up',
                redis: redisPing === 'PONG' ? 'up' : 'down',
            },
        };
        console.log('Sending response:', JSON.stringify(response));
        res.status(200).json(response);
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(503).json({
            status: 'degraded',
            services: {
                postgres: 'down',
                redis: 'unknown'
            },
            error: String(err)
        });
    }
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});

startHealthCheckJob();

export default app;