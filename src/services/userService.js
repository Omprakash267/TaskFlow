import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  dbEvents,
} from "./localDb.js";

/**
 * Get a user's profile from local database
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const profiles = getStorageItem(STORAGE_KEYS.PROFILES, {});
  return profiles[uid] || null;
};

/**
 * Create or update a user's profile in local database
 */
export const createUserProfile = async (uid, data = {}) => {
  if (!uid) return null;
  const profiles = getStorageItem(STORAGE_KEYS.PROFILES, {});
  const email = data.email || "";
  const displayName = (data.displayName || email.split("@")[0] || "User").trim();

  profiles[uid] = {
    uid,
    email,
    displayName,
    notificationsEnabled: data.notificationsEnabled ?? true,
    createdAt: data.createdAt || new Date().toISOString(),
    ...data,
  };

  setStorageItem(STORAGE_KEYS.PROFILES, profiles);
  dbEvents.emit("profile_change", profiles[uid]);
  return profiles[uid];
};

/**
 * Update a user's profile fields
 */
export const updateUserProfile = async (uid, data = {}) => {
  if (!uid) return null;
  const profiles = getStorageItem(STORAGE_KEYS.PROFILES, {});
  if (profiles[uid]) {
    profiles[uid] = {
      ...profiles[uid],
      ...data,
      displayName: data.displayName !== undefined ? data.displayName.trim() : profiles[uid].displayName,
    };
    setStorageItem(STORAGE_KEYS.PROFILES, profiles);
    dbEvents.emit("profile_change", profiles[uid]);
    return profiles[uid];
  } else {
    return await createUserProfile(uid, data);
  }
};

