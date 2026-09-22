import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  generateId,
  dbEvents,
} from "./localDb.js";
import { isValidEmail, isValidPassword } from "../utils/helpers.js";

/**
 * Get the current authenticated user session
 */
export const getCurrentUser = () => {
  return getStorageItem(STORAGE_KEYS.SESSION, null);
};

/**
 * Create a new user account locally
 */
export const signupUser = async (email, password) => {
  if (!email || !email.trim()) {
    const error = new Error("Email is required.");
    error.code = "auth/invalid-email";
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    const error = new Error("Please enter a valid email address.");
    error.code = "auth/invalid-email";
    throw error;
  }

  if (!isValidPassword(password)) {
    const error = new Error("Password must be at least 6 characters.");
    error.code = "auth/weak-password";
    throw error;
  }

  const users = getStorageItem(STORAGE_KEYS.USERS, []);

  // Check if email already registered
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.code = "auth/email-already-in-use";
    throw error;
  }

  const defaultDisplayName = normalizedEmail.split("@")[0];
  const newUser = {
    uid: generateId("usr"),
    email: normalizedEmail,
    password: password, // Stored in private local sandbox storage for learning project
    displayName: defaultDisplayName,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  setStorageItem(STORAGE_KEYS.USERS, users);

  // Initialize profile
  const profiles = getStorageItem(STORAGE_KEYS.PROFILES, {});
  profiles[newUser.uid] = {
    uid: newUser.uid,
    email: newUser.email,
    displayName: newUser.displayName,
    notificationsEnabled: true,
    createdAt: newUser.createdAt,
  };
  setStorageItem(STORAGE_KEYS.PROFILES, profiles);

  // Set active session
  const sessionUser = {
    uid: newUser.uid,
    email: newUser.email,
    displayName: newUser.displayName,
  };
  setStorageItem(STORAGE_KEYS.SESSION, sessionUser);
  dbEvents.emit("auth_change", sessionUser);

  return { user: sessionUser };
};

/**
 * Sign in with email and password
 */
export const loginUser = async (email, password) => {
  if (!email || !email.trim() || !password) {
    const error = new Error("Email and password are required.");
    error.code = "auth/invalid-credential";
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getStorageItem(STORAGE_KEYS.USERS, []);

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.code = "auth/invalid-credential";
    throw error;
  }

  const sessionUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split("@")[0],
  };

  setStorageItem(STORAGE_KEYS.SESSION, sessionUser);
  dbEvents.emit("auth_change", sessionUser);

  return { user: sessionUser };
};

/**
 * Sign out the current user
 */
export const logoutUser = async () => {
  removeStorageItem(STORAGE_KEYS.SESSION);
  dbEvents.emit("auth_change", null);
};

/**
 * Listen for authentication state changes
 */
export const onAuthChange = (callback) => {
  // Immediately call with current user
  const current = getCurrentUser();
  callback(current);

  // Subscribe to changes
  return dbEvents.on("auth_change", (user) => {
    callback(user);
  });
};

/**
 * Change password for the currently logged-in user
 */
export const changePassword = async (currentPassword, newPassword) => {
  const current = getCurrentUser();
  if (!current) {
    throw new Error("No authenticated user.");
  }

  if (!isValidPassword(newPassword)) {
    const error = new Error("New password must be at least 6 characters.");
    error.code = "auth/weak-password";
    throw error;
  }

  const users = getStorageItem(STORAGE_KEYS.USERS, []);
  const userIndex = users.findIndex((u) => u.uid === current.uid);

  if (userIndex === -1) {
    throw new Error("User account not found.");
  }

  if (users[userIndex].password !== currentPassword) {
    const error = new Error("Incorrect current password.");
    error.code = "auth/wrong-password";
    throw error;
  }

  users[userIndex].password = newPassword;
  setStorageItem(STORAGE_KEYS.USERS, users);
  return true;
};

/**
 * Reset password locally (for offline demo / training app)
 */
export const resetPassword = async (email, newPassword = null) => {
  if (!email || !email.trim()) {
    const error = new Error("Please provide a valid email.");
    error.code = "auth/invalid-email";
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getStorageItem(STORAGE_KEYS.USERS, []);
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

  if (userIndex === -1) {
    const error = new Error("No account found with this email.");
    error.code = "auth/user-not-found";
    throw error;
  }

  // If a new password is provided, update it directly (offline recovery flow)
  if (newPassword) {
    if (!isValidPassword(newPassword)) {
      const error = new Error("Password must be at least 6 characters.");
      error.code = "auth/weak-password";
      throw error;
    }
    users[userIndex].password = newPassword;
    setStorageItem(STORAGE_KEYS.USERS, users);
  }

  return true;
};

/**
 * Update the current user's display name
 */
export const updateUserDisplayName = async (displayName) => {
  const current = getCurrentUser();
  if (!current) return;

  const trimmedName = displayName?.trim() || current.email.split("@")[0];

  const users = getStorageItem(STORAGE_KEYS.USERS, []);
  const updatedUsers = users.map((u) => {
    if (u.uid === current.uid) {
      return { ...u, displayName: trimmedName };
    }
    return u;
  });
  setStorageItem(STORAGE_KEYS.USERS, updatedUsers);

  // Update profile
  const profiles = getStorageItem(STORAGE_KEYS.PROFILES, {});
  if (profiles[current.uid]) {
    profiles[current.uid].displayName = trimmedName;
    setStorageItem(STORAGE_KEYS.PROFILES, profiles);
    dbEvents.emit("profile_change", profiles[current.uid]);
  }

  const updatedSession = { ...current, displayName: trimmedName };
  setStorageItem(STORAGE_KEYS.SESSION, updatedSession);
  dbEvents.emit("auth_change", updatedSession);
};

/**
 * Delete the current user's account and all their tasks
 */
export const deleteUserAccount = async () => {
  const current = getCurrentUser();
  if (!current) return;

  // Remove from users list
  const users = getStorageItem(STORAGE_KEYS.USERS, []);
  const filteredUsers = users.filter((u) => u.uid !== current.uid);
  setStorageItem(STORAGE_KEYS.USERS, filteredUsers);

  // Remove all tasks belonging to this user
  const todos = getStorageItem(STORAGE_KEYS.TODOS, []);
  const filteredTodos = todos.filter((t) => t.userId !== current.uid);
  setStorageItem(STORAGE_KEYS.TODOS, filteredTodos);
  dbEvents.emit("todos_change", filteredTodos);

  // Remove user profile
  const profiles = getStorageItem(STORAGE_KEYS.PROFILES, {});
  delete profiles[current.uid];
  setStorageItem(STORAGE_KEYS.PROFILES, profiles);

  // Clear session & log out
  await logoutUser();
};