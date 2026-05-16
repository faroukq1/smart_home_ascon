import { useEffect, useRef } from "react";
import { sensorAPI } from "../api/client";
import {
  requestNotificationPermission,
  sendLocalNotification,
} from "../utils/notifications";

export function useMotionAlert() {
  const prevStatus = useRef<string | null>(null);
  const permGranted = useRef(false);

  useEffect(() => {
    requestNotificationPermission().then((granted) => {
      permGranted.current = granted;
    });

    const poll = async () => {
      try {
        const res = await sensorAPI.getStatus();
        const status: string = res.data.status;

        if (
          status === "motion" &&
          prevStatus.current !== "motion" &&
          prevStatus.current !== null &&
          permGranted.current
        ) {
          await sendLocalNotification(
            "⚠️ Motion Detected!",
            "Movement detected by your ESP32-CAM sensor.",
          );
        }

        prevStatus.current = status;
      } catch {
        // ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);
}
