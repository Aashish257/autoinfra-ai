import cron from 'node-cron';
import { runGlobalHealthCheck } from '../services/healing.service.js';

export function startHealthCheckJob() {
    // Runs every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
        console.log('[CRON] Running global health check...');
        try {
            const results = await runGlobalHealthCheck();
            const healed = results.filter((r: any) => r.result && r.result.status === 'healed');
            console.log(`[CRON] Done. Healed: ${healed.length}/${results.length}`);
        } catch (err) {
            console.error('[CRON] Health check error:', err);
        }
    });

    console.log('[CRON] Health check job registered (every 2 min)');
}