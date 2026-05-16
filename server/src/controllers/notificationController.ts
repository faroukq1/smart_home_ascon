import { Response } from "express";
import { getPrismaClient } from "../utils/db";
import { getCurrentTime } from "../utils/helpers";
import { AuthRequest } from "../middleware/auth";

const prisma = getPrismaClient();

const buildImageUrl = (
  req: AuthRequest,
  imageKey?: string | null,
): string | null => {
  if (!imageKey) return null;
  const host = req.get("host");
  if (!host) return `/uploads/${imageKey}`;
  return `${req.protocol}://${host}/uploads/${imageKey}`;
};

const mapNotification = (req: AuthRequest, notification: any) => ({
  ...notification,
  imageUrl: buildImageUrl(req, notification.imageKey),
});

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string) || 50,
    });

    res.json(
      notifications.map((notification) => mapNotification(req, notification)),
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type, status, imageKey } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { time, date } = getCurrentTime();

    const notification = await prisma.notification.create({
      data: { userId, type, status, date, time, imageKey },
    });

    res.status(201).json(mapNotification(req, notification));
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

export const clearAllNotifications = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
};

export const getAlertStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const totalAlerts = await prisma.notification.count({
      where: { userId, type: "alarm" },
    });

    const lastAlert = await prisma.notification.findFirst({
      where: { userId, type: "alarm" },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      totalAlerts,
      lastAlert: lastAlert ? mapNotification(req, lastAlert) : null,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alert stats" });
  }
};
