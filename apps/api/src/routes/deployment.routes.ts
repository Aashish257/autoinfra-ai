import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as DeploymentController from '../controllers/deployment.controller.js';
const router = Router();

router.use(authenticate);

router.get('/', DeploymentController.getAll);
router.post('/', authorize('ADMIN', 'DEVELOPER'), DeploymentController.create);
router.get('/cluster-status', DeploymentController.getClusterStatus);
router.get('/:id', DeploymentController.getOne);
router.patch('/:id', authorize('ADMIN', 'DEVELOPER'), DeploymentController.update);
router.delete('/:id', authorize('ADMIN'), DeploymentController.remove);
router.post('/:id/deploy', authorize('ADMIN', 'DEVELOPER'), DeploymentController.deploy);
router.get('/:id/pods', DeploymentController.getPods);
router.get('/:id/k8s-status', DeploymentController.getK8sStatus);

export default router;