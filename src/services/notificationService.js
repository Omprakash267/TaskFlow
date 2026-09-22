/**
 * Notification Service
 * Uses Capacitor Local Notifications on native (Android/iOS),
 * and falls back gracefully in web browsers.
 */

import { Capacitor } from "@capacitor/core";

let LocalNotifications = null;
let pluginPromise = null;
let pluginAvailable = null;

/**
 * Initialize the notification plugin (Capacitor native only)
 */
const getPlugin = async () => {
  if (!Capacitor?.isNativePlatform?.()) {
    pluginAvailable = false;
    return null;
  }
  if (LocalNotifications) return LocalNotifications;
  if (pluginAvailable === false) return null;

  if (!pluginPromise) {
    pluginPromise = import("@capacitor/local-notifications")
      .then((module) => {
        LocalNotifications = module.LocalNotifications;
        pluginAvailable = true;
        return LocalNotifications;
      })
      .catch(() => {
        pluginAvailable = false;
        return null;
      });
  }
  return pluginPromise;
};

/**
 * Check if notifications are available on the current platform
 */
export const isNotificationAvailable = async () => {
  const plugin = await getPlugin();
  return plugin !== null;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.requestPermissions();
    return result.display === "granted";
  } catch (err) {
    console.warn("Notification permission request failed:", err);
    return false;
  }
};

/**
 * Check current notification permission status
 */
export const checkNotificationPermission = async () => {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.checkPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
};

/**
 * Schedule a reminder notification for a task
 */
export const scheduleReminder = async (task) => {
  if (!task || !task.reminderTime || !task.id) return false;

  const reminderDate = new Date(task.reminderTime);
  if (isNaN(reminderDate.getTime()) || reminderDate <= new Date()) {
    return false;
  }

  const plugin = await getPlugin();
  if (!plugin) return false;

  try {
    // First ensure we have permission
    const hasPerm = await checkNotificationPermission();
    if (!hasPerm) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    const notifId = hashStringToInt(task.id);

    // Cancel existing notification with the same ID first to avoid duplicates
    try {
      await plugin.cancel({
        notifications: [{ id: notifId }],
      });
    } catch {
      // Ignore if no existing notification
    }

    await plugin.schedule({
      notifications: [
        {
          id: notifId,
          title: "Task Reminder",
          body: task.title,
          schedule: { at: reminderDate },
          sound: "default",
          smallIcon: "ic_stat_icon_config_sample",
          actionTypeId: "TASK_REMINDER",
          extra: { taskId: task.id },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn("Failed to schedule notification:", err);
    return false;
  }
};

/**
 * Cancel a scheduled reminder
 */
export const cancelReminder = async (taskId) => {
  if (!taskId) return;
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({
      notifications: [{ id: hashStringToInt(taskId) }],
    });
  } catch (err) {
    // Suppress cancel errors in web/offline environments
  }
};

/**
 * Hash a string to a positive 31-bit integer for notification IDs
 */
export const hashStringToInt = (str) => {
  if (!str) return 1;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return (positive % 2147483647) || 1;
};

