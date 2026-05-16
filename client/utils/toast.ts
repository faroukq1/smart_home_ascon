import { Alert, Platform, ToastAndroid } from "react-native";

let lastToastAt = 0;
const DEFAULT_INTERVAL_MS = 4000;

export const showToast = (
  message: string,
  title: string = "Error",
  minIntervalMs: number = DEFAULT_INTERVAL_MS,
) => {
  const now = Date.now();
  if (now - lastToastAt < minIntervalMs) return;
  lastToastAt = now;

  if (Platform.OS === "android") {
    ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.TOP);
    return;
  }

  Alert.alert(title, message);
};
