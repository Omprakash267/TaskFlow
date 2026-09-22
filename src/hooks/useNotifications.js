import { useState, useEffect, useCallback } from "react";
import {
  isNotificationAvailable,
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from "../services/notificationService";

/**
 * Custom hook for managing notifications
 */
export default function useNotifications() {
  const [available, setAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const init = async () => {
      const isAvail = await isNotificationAvailable();
      setAvailable(isAvail);
      if (isAvail) {
        const granted = await checkNotificationPermission();
        setHasPermission(granted);
      }
    };
    init();
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  return {
    available,
    hasPermission,
    requestPermission,
    scheduleReminder,
    cancelReminder,
  };
}
