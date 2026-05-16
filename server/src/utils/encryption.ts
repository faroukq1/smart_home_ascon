import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  encrypt128,
  decrypt128,
  hashAscon,
  toHex,
  fromHex,
  strToBytes,
  getKey,
} from "./ascon";

const SENSOR_KEY = getKey(process.env.ASCON_KEY);

export const encryptValue = (value: string): string => {
  try {
    const nonce = crypto.randomBytes(16);
    const pt = strToBytes(value);
    const { ct, tag } = encrypt128(SENSOR_KEY, nonce, pt);
    return `${toHex(nonce)}:${toHex(ct)}:${toHex(tag)}`;
  } catch {
    return value;
  }
};

export const decryptValue = (encrypted: string): string => {
  // Legacy raw values from before ASCON encryption
  if (encrypted === "1") return "motion";
  if (encrypted === "0") return "connected";

  // ASCON-encrypted format: nonce:ciphertext:tag
  if (encrypted.includes(":")) {
    try {
      const [nonceHex, ctHex, tagHex] = encrypted.split(":");
      const pt = decrypt128(
        SENSOR_KEY,
        fromHex(nonceHex),
        fromHex(ctHex),
        fromHex(tagHex)
      );
      if (!pt) return "unknown";
      return new TextDecoder().decode(pt);
    } catch {
      return "unknown";
    }
  }

  return encrypted;
};

export const hashSensorValue = (value: string): string => {
  return toHex(hashAscon(strToBytes(value)));
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
