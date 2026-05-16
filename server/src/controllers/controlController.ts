import { Response } from "express";
import { getPrismaClient } from "../utils/db";
import { getCurrentTime } from "../utils/helpers";
import { AuthRequest } from "../middleware/auth";

const prisma = getPrismaClient();

const getLatestControlState = async (userId: number, type: string) => {
  const latest = await prisma.control.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    select: { action: true },
  });

  return latest?.action === "on";
};

export const logControlAction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type, action } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { time, date } = getCurrentTime();

    const control = await prisma.control.create({
      data: { userId, type, action, date, time },
    });

    res.status(201).json(control);
  } catch (error) {
    res.status(500).json({ error: "Failed to log control action" });
  }
};

export const toggleLED = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { state } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const action = state ? "on" : "off";
    const { time, date } = getCurrentTime();

    const control = await prisma.control.create({
      data: { userId, type: "led", action, date, time },
    });

    res.json({ success: true, control });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle LED" });
  }
};

export const toggleBuzzer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { state } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const action = state ? "on" : "off";
    const { time, date } = getCurrentTime();

    const control = await prisma.control.create({
      data: { userId, type: "buzzer", action, date, time },
    });

    res.json({ success: true, control });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle buzzer" });
  }
};

export const captureImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { time, date } = getCurrentTime();

    const control = await prisma.control.create({
      data: { userId, type: "capture", action: "triggered", date, time },
    });

    res.json({ success: true, control });
  } catch (error) {
    res.status(500).json({ error: "Failed to capture image" });
  }
};

export const getControlHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const controls = await prisma.control.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string) || 50,
    });

    res.json(controls);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch control history" });
  }
};

export const clearControlHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.control.deleteMany({ where: { userId } });

    res.json({ message: "Control history cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear control history" });
  }
};

export const getLedStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isOn = await getLatestControlState(userId, "led");
    res.json(isOn);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch LED status" });
  }
};

export const getBuzzerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isOn = await getLatestControlState(userId, "buzzer");
    res.json(isOn);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch buzzer status" });
  }
};
