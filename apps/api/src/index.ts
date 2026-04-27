import app from './app.js';
import { startHealthCheckJob } from './jobs/healthCheck.job.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});

startHealthCheckJob();