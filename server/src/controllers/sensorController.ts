import { Response, Request } from "express";
import { getPrismaClient } from "../utils/db";
import { decryptValue } from "../utils/encryption";
import { getCurrentTime } from "../utils/helpers";
import { sendPushNotification } from "../utils/push";
import { AuthRequest } from "../middleware/auth";

const prisma = getPrismaClient();

const buildImageUrl = (
  req: Request,
  imageKey?: string | null,
): string | null => {
  if (!imageKey) return null;
  const host = req.get("host");
  if (!host) return `/uploads/${imageKey}`;
  return `${req.protocol}://${host}/uploads/${imageKey}`;
};

export const getSensorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const sensorStatus = await prisma.sensorStatus.findUnique({
      where: { id: 1 },
    });

    if (!sensorStatus) {
      return res.status(404).json({ error: "Sensor status not found" });
    }

    const userId = req.userId;
    let lastImageUrl: string | null = null;

    if (userId) {
      const lastNotification = await prisma.notification.findFirst({
        where: { userId, imageKey: { not: null } },
        orderBy: { createdAt: "desc" },
      });
      if (lastNotification?.imageKey) {
        lastImageUrl = buildImageUrl(req, lastNotification.imageKey);
      }
    }

    res.json({
      status: decryptValue(sensorStatus.status),
      rawStatus: sensorStatus.status,
      lastImageUrl,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sensor status" });
  }
};

export const updateSensorStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const sensorStatus = await prisma.sensorStatus.upsert({
      where: { id: 1 },
      update: { status },
      create: { status },
    });

    res.json(sensorStatus);
  } catch (error) {
    res.status(500).json({ error: "Failed to update sensor status" });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imageKey = req.file.filename;
    const status = "1";
    const { time, date } = getCurrentTime();

    const sensorStatus = await prisma.sensorStatus.upsert({
      where: { id: 1 },
      update: { status, lastImageKey: imageKey },
      create: { status, lastImageKey: imageKey },
    });

    const requestedUserId = Number.parseInt(req.body.userId, 10);
    let userId = Number.isFinite(requestedUserId) ? requestedUserId : undefined;

    if (!userId) {
      const user = await prisma.user.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      userId = user?.id;
    }

    const imageUrl = buildImageUrl(req, imageKey);
    let notification = null;
    let expoPushToken: string | null = null;

    if (userId) {
      notification = await prisma.notification.create({
        data: {
          userId,
          type: "alarm",
          status: "detect_movement",
          date,
          time,
          imageKey,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { expoPushToken: true },
      });
      expoPushToken = user?.expoPushToken || null;
    }

    if (expoPushToken) {
      await sendPushNotification({
        to: expoPushToken,
        title: "Motion detected",
        body: "A new motion event was detected.",
        data: { type: "alarm", imageUrl },
      });
    }

    res.status(201).json({
      imageKey,
      imageUrl,
      notification,
      sensorStatus: {
        ...sensorStatus,
        lastImageUrl: imageUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
};
