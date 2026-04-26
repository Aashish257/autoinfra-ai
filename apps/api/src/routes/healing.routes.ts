import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as HealingController from '../controllers/healing.controller.js';

const router = Router();

router.use(authenticate);

router.post('/:id/check', authorize('ADMIN', 'DEVELOPER'), HealingController.triggerCheck);
router.post('/:id/metrics', authorize('ADMIN', 'DEVELOPER'), HealingController.injectMetric);
router.get('/:id/healing-events', HealingController.getHealingEvents);
router.post('/global-check', authorize('ADMIN'), HealingController.globalCheck);

export default router;