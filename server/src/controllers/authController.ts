import { Response } from "express";
import { getPrismaClient } from "../utils/db";
import { hashPassword, comparePassword } from "../utils/encryption";
import { generateToken } from "../utils/helpers";
import { AuthRequest } from "../middleware/auth";
import { decrypt128, fromHex, DEFAULT_KEY_HEX, getKey } from "../utils/ascon";

const prisma = getPrismaClient();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function decryptBody(body: any): Record<string, any> | null {
  if (body.payload && body.nonce && body.tag) {
    try {
      const key = getKey(process.env.ASCON_KEY || DEFAULT_KEY_HEX);
      const pt = decrypt128(
        key,
        fromHex(body.nonce),
        fromHex(body.payload),
        fromHex(body.tag)
      );
      if (!pt) return null;
      return JSON.parse(new TextDecoder().decode(pt));
    } catch {
      return null;
    }
  }
  // Unencrypted fallback for development/testing
  return body;
}

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const decrypted = decryptBody(req.body);
    if (!decrypted) {
      return res.status(400).json({ error: "Invalid or tampered request" });
    }

    const { email, password, language = "en" } = decrypted;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, language },
    });

    const token = generateToken(user.id);
    res.status(201).json({ user: { id: user.id, email, language }, token });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const decrypted = decryptBody(req.body);
    if (!decrypted) {
      return res.status(400).json({ error: "Invalid or tampered request" });
    }

    const { email, password } = decrypted;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    res.json({ user: { id: user.id, email, language: user.language }, token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new passwords required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: "New password must differ from current" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await comparePassword(oldPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Password change failed" });
  }
};

export const updateLanguage = async (req: AuthRequest, res: Response) => {
  try {
    const { language } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!["en", "ar", "fr"].includes(language)) {
      return res.status(400).json({ error: "Invalid language" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { language },
    });

    res.json({
      user: { id: user.id, email: user.email, language: user.language },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update language" });
  }
};

export const updatePushToken = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { expoPushToken } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (expoPushToken !== null && typeof expoPushToken !== "string") {
      return res.status(400).json({ error: "Invalid push token" });
    }

    const tokenValue =
      typeof expoPushToken === "string" && expoPushToken.trim().length > 0
        ? expoPushToken.trim()
        : null;

    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: tokenValue },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update push token" });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, language: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};
