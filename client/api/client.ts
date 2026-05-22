import axios from "axios";
import { showToast } from "../utils/toast";
import {
  encrypt128,
  toHex,
  fromHex,
  strToBytes,
  getKey,
  randomNonce,
} from "../utils/ascon";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
console.log("[API] URL:", API_URL);

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

let authToken: string | null = null;

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error?.response || error?.code === "ECONNABORTED";
    if (isNetworkError) {
      console.error("[API] Network error:", error?.code, error?.message, "URL:", API_URL);
      showToast("No connection to the server");
    }
    if (error?.response?.status !== 401) {
      console.error("API Error:", error?.message);
    }
    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string) => {
  authToken = token;
  client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  authToken = null;
  delete client.defaults.headers.common["Authorization"];
};

export const getAuthToken = () => authToken;

function asconEncrypt(payload: object): {
  payload: string;
  nonce: string;
  tag: string;
} {
  const key = getKey(process.env.EXPO_PUBLIC_ASCON_KEY);
  const nonce = randomNonce();
  const pt = strToBytes(JSON.stringify(payload));
  const { ct, tag } = encrypt128(key, nonce, pt);
  return { payload: toHex(ct), nonce: toHex(nonce), tag: toHex(tag) };
}

// Auth API
export const authAPI = {
  register: (email: string, password: string, language: string = "en") =>
    client.post("/auth/register", asconEncrypt({ email, password, language })),

  login: (email: string, password: string) =>
    client.post("/auth/login", asconEncrypt({ email, password })),

  changePassword: (oldPassword: string, newPassword: string) =>
    client.post("/auth/change-password", { oldPassword, newPassword }),

  updateLanguage: (language: string) =>
    client.put("/auth/language", { language }),

  updatePushToken: (expoPushToken: string | null) =>
    client.post("/auth/push-token", { expoPushToken }),

  getProfile: () => client.get("/auth/profile"),
};

// Notification API
export const notificationAPI = {
  getAll: (limit: number = 50) =>
    client.get("/notifications", { params: { limit } }),

  create: (type: string, status: string) =>
    client.post("/notifications", { type, status }),

  delete: (id: number) => client.delete(`/notifications/${id}`),

  clearAll: () => client.delete("/notifications"),

  getStats: () => client.get("/notifications/stats/alerts"),
};

// Control API
export const controlAPI = {
  logAction: (type: string, action: string) =>
    client.post("/controls/log", { type, action }),

  toggleLED: (state: boolean) => client.post("/controls/led", { state }),

  toggleBuzzer: (state: boolean) => client.post("/controls/buzzer", { state }),

  getLedStatus: () => client.get("/controls/led/status"),

  getBuzzerStatus: () => client.get("/controls/buzzer/status"),

  getSystemStatus: () => client.get("/controls/system/status"),

  toggleSystem: (state: boolean) => client.post("/controls/system", { state }),

  captureImage: () => client.post("/controls/capture"),

  getHistory: (limit: number = 50) =>
    client.get("/controls/history", { params: { limit } }),

  clearAll: () => client.delete("/controls"),
};

// Sensor API
export const sensorAPI = {
  getStatus: () => client.get("/sensor/status"),

  updateStatus: (status: string) => client.post("/sensor/status", { status }),

  uploadImage: (
    file: { uri: string; name: string; type: string },
    userId?: number,
  ) => {
    const data = new FormData();
    data.append("image", file as any);
    if (userId) data.append("userId", userId.toString());

    return client.post("/sensor/image", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default client;
