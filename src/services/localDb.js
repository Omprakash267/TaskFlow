/**
 * Local Database Engine
 * A robust, local-first storage engine that provides multi-user isolation,
 * persistence via localStorage, and real-time reactive event listeners.
 */

const STORAGE_KEYS = {
  USERS: "taskflow_users",
  SESSION: "taskflow_session",
  TODOS: "taskflow_todos",
  PROFILES: "taskflow_profiles",
};

// Default structures for storage keys
const DEFAULT_STORAGE = {
  [STORAGE_KEYS.USERS]: [],
  [STORAGE_KEYS.SESSION]: null,
  [STORAGE_KEYS.TODOS]: [],
  [STORAGE_KEYS.PROFILES]: {},
};

// Event emitter for real-time reactive subscriptions
class LocalEventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (typeof callback !== "function") return () => {};
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      // Create a shallow copy of listeners in case a listener unsubscribes during emit
      const callbacks = Array.from(this.listeners[event]);
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      });
    }
  }
}

export const dbEvents = new LocalEventEmitter();

// In-memory cache for ultra-fast (sub-millisecond) reads and writes
const memoryCache = new Map();

// Helper to safely read from storage with in-memory caching and fallback defaults
export const getStorageItem = (key, fallback = undefined) => {
  const defaultValue = fallback !== undefined ? fallback : (DEFAULT_STORAGE[key] !== undefined ? DEFAULT_STORAGE[key] : null);

  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      memoryCache.set(key, defaultValue);
      return defaultValue;
    }
    const parsed = JSON.parse(item);
    memoryCache.set(key, parsed);
    return parsed;
  } catch (err) {
    console.warn(`[LocalDB] Corrupted or invalid JSON for key "${key}", using safe default:`, err);
    memoryCache.set(key, defaultValue);
    return defaultValue;
  }
};

// Helper to safely write to storage and update cache immediately
export const setStorageItem = (key, value) => {
  try {
    memoryCache.set(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[LocalDB] Failed writing key "${key}" to storage:`, err);
    return false;
  }
};

// Helper to safely remove item from storage and cache
export const removeStorageItem = (key) => {
  try {
    memoryCache.delete(key);
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`[LocalDB] Failed removing key "${key}" from storage:`, err);
    return false;
  }
};

// Listen for storage events across tabs to keep cache in sync
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("storage", (e) => {
    if (e.key) {
      try {
        const newVal = e.newValue ? JSON.parse(e.newValue) : (DEFAULT_STORAGE[e.key] !== undefined ? DEFAULT_STORAGE[e.key] : null);
        memoryCache.set(e.key, newVal);
        if (e.key === STORAGE_KEYS.TODOS) {
          dbEvents.emit("todos_change", newVal);
        } else if (e.key === STORAGE_KEYS.SESSION) {
          dbEvents.emit("auth_change", newVal);
        } else if (e.key === STORAGE_KEYS.PROFILES) {
          dbEvents.emit("profile_change", newVal);
        }
      } catch {
        // Suppress parsing errors on external changes
      }
    }
  });
}

// Helper to generate collision-resistant unique IDs
export const generateId = (prefix = "id") => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const counter = (generateId._counter = (generateId._counter || 0) + 1).toString(36);
  return `${prefix}_${timestamp}_${randomPart}_${counter}`;
};

export { STORAGE_KEYS };

