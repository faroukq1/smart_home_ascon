import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, notificationController.getNotifications);
router.post('/', authMiddleware, notificationController.createNotification);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);
router.delete('/', authMiddleware, notificationController.clearAllNotifications);
router.get('/stats/alerts', authMiddleware, notificationController.getAlertStats);

export default router;
