import { getStorageItem, setStorageItem, generateId, dbEvents } from "./localDb.js";

const getStorageKey = (userId) => `taskflow_scratchpad_${userId || "guest"}`;

/**
 * Get all scratchpad items for a user
 */
export const getScratchpadItems = (userId) => {
  if (!userId) return [];
  return getStorageItem(getStorageKey(userId), []);
};

/**
 * Subscribe to scratchpad changes
 */
export const subscribeToScratchpad = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  callback(getScratchpadItems(userId));

  const unsubscribe = dbEvents.on("scratchpad_change", () => {
    callback(getScratchpadItems(userId));
  });

  return unsubscribe;
};

/**
 * Add a new item to scratchpad
 */
export const addScratchpadItem = (userId, text) => {
  if (!userId || !text?.trim()) return null;
  const items = getScratchpadItems(userId);
  const newItem = {
    id: generateId("scratch"),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...items];
  setStorageItem(getStorageKey(userId), updated);
  dbEvents.emit("scratchpad_change", updated);
  return newItem;
};

/**
 * Toggle completed state of a scratchpad item
 */
export const toggleScratchpadItem = (userId, itemId) => {
  if (!userId || !itemId) return;
  const items = getScratchpadItems(userId);
  const updated = items.map((item) =>
    item.id === itemId ? { ...item, completed: !item.completed } : item
  );
  setStorageItem(getStorageKey(userId), updated);
  dbEvents.emit("scratchpad_change", updated);
};

/**
 * Delete an item from scratchpad
 */
export const deleteScratchpadItem = (userId, itemId) => {
  if (!userId || !itemId) return;
  const items = getScratchpadItems(userId);
  const updated = items.filter((item) => item.id !== itemId);
  setStorageItem(getStorageKey(userId), updated);
  dbEvents.emit("scratchpad_change", updated);
};

/**
 * Complete all items in scratchpad
 */
export const completeAllScratchpadItems = (userId) => {
  if (!userId) return;
  const items = getScratchpadItems(userId);
  const updated = items.map((item) => ({ ...item, completed: true }));
  setStorageItem(getStorageKey(userId), updated);
  dbEvents.emit("scratchpad_change", updated);
};

/**
 * Clear all completed items from scratchpad
 */
export const clearCompletedScratchpadItems = (userId) => {
  if (!userId) return;
  const items = getScratchpadItems(userId);
  const updated = items.filter((item) => !item.completed);
  setStorageItem(getStorageKey(userId), updated);
  dbEvents.emit("scratchpad_change", updated);
};
