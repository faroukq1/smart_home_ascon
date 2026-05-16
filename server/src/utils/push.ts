import axios from "axios";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const sendPushNotification = async (message: PushMessage) => {
  if (!message.to) return;

  try {
    await axios.post(EXPO_PUSH_URL, {
      to: message.to,
      sound: "default",
      title: message.title,
      body: message.body,
      data: message.data,
    });
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
};
