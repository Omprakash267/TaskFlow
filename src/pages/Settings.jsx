import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import useNotifications from "../hooks/useNotifications";
import Header from "../components/Header";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  updateUserDisplayName,
  changePassword,
  deleteUserAccount,
} from "../services/authService";
import { updateUserProfile } from "../services/userService";
import { getUserTodos, clearAllUserTodos } from "../services/todoService";
import { setStorageItem, getStorageItem, STORAGE_KEYS, dbEvents, generateId } from "../services/localDb";
import { APP_VERSION } from "../constants";

export default function Settings() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const { available: notifAvailable, hasPermission, requestPermission } = useNotifications();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Dialogs
  const [showClearTasksConfirm, setShowClearTasksConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataMessage, setDataMessage] = useState("");

  useEffect(() => {
    if (profile?.displayName || user?.displayName) {
      setDisplayName(profile?.displayName || user?.displayName || "");
    }
  }, [profile, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileError("Display name cannot be empty.");
      return;
    }
    if (trimmed.length > 50) {
      setProfileError("Display name must be under 50 characters.");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      await updateUserDisplayName(trimmed);
      await updateUserProfile(user.uid, { displayName: trimmed });
      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordForm(false);
      }, 2500);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleClearTasks = async () => {
    if (!user?.uid) return;
    try {
      await clearAllUserTodos(user.uid);
      setDataMessage("All tasks have been cleared.");
      setTimeout(() => setDataMessage(""), 3000);
    } catch (err) {
      console.error("Error clearing tasks:", err);
    } finally {
      setShowClearTasksConfirm(false);
    }
  };

  const handleExportTasks = () => {
    if (!user?.uid) return;
    const userTodos = getUserTodos(user.uid);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userTodos, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `todo_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDataMessage("Tasks exported successfully.");
    setTimeout(() => setDataMessage(""), 3000);
  };

  const handleImportTasks = (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          throw new Error("Invalid format");
        }

        const allTodos = getStorageItem(STORAGE_KEYS.TODOS, []);
        const validTasks = imported.map((t) => ({
          ...t,
          id: t.id || generateId("task"),
          title: t.title?.trim() || "Untitled Task",
          completed: Boolean(t.completed),
          checklist: Array.isArray(t.checklist) ? t.checklist : [],
          userId: user.uid,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        const otherTodos = allTodos.filter((t) => t.userId !== user.uid);
        const combined = [...validTasks, ...otherTodos];
        setStorageItem(STORAGE_KEYS.TODOS, combined);
        dbEvents.emit("todos_change", combined);

        setDataMessage(`Imported ${validTasks.length} tasks successfully.`);
        setTimeout(() => setDataMessage(""), 3000);
      } catch (err) {
        setDataMessage("Failed to import tasks. Invalid JSON file.");
        setTimeout(() => setDataMessage(""), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUserAccount();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Account deletion error:", err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="page settings-page">
      <Header title="Settings" />

      {/* Profile Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Profile</h2>
        <div className="settings-card">
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="settings-email">Email</label>
              <input
                id="settings-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="input-disabled"
              />
            </div>
            <div className="form-group">
              <label htmlFor="settings-name">Display Name</label>
              <input
                id="settings-name"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (profileError) setProfileError("");
                }}
                maxLength={50}
                required
              />
            </div>
            {profileError && <p className="form-error">{profileError}</p>}
            {profileSuccess && <p className="form-success">✅ Profile updated successfully!</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-card">
          <div className="theme-options" role="group" aria-label="Theme selection">
            {[
              { id: "light", icon: "☀️", label: "Light" },
              { id: "dark", icon: "🌙", label: "Dark" },
              { id: "system", icon: "💻", label: "System" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`theme-option ${theme === mode.id ? "theme-option-active" : ""}`}
                onClick={() => setThemeMode(mode.id)}
                aria-pressed={theme === mode.id}
              >
                <span className="theme-option-icon">{mode.icon}</span>
                <span className="theme-option-label">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Notifications</h2>
        <div className="settings-card">
          {notifAvailable ? (
            <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className="settings-row-label">Task Reminders</p>
                <p className="settings-row-sub">
                  {hasPermission ? "Permission Granted" : "Permission Required"}
                </p>
              </div>
              {!hasPermission ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => requestPermission()}
                >
                  Enable
                </button>
              ) : (
                <span style={{ color: "var(--success)", fontWeight: 600 }}>Active</span>
              )}
            </div>
          ) : (
            <p className="settings-row-sub">
              🔔 Local task notifications will be delivered on supported devices & Android app.
            </p>
          )}
        </div>
      </section>

      {/* Security & Password Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Security</h2>
        <div className="settings-card">
          {!showPasswordForm ? (
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Change Password</h3>
              <div className="form-group" style={{ marginBottom: "8px" }}>
                <label htmlFor="curr-pass">Current Password</label>
                <input
                  id="curr-pass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "8px" }}>
                <label htmlFor="new-pass">New Password</label>
                <input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "8px" }}>
                <label htmlFor="confirm-new-pass">Confirm New Password</label>
                <input
                  id="confirm-new-pass"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              {passwordError && <p className="form-error">{passwordError}</p>}
              {passwordSuccess && <p className="form-success">✅ Password updated successfully!</p>}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Data Management Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Data Management</h2>
        <div className="settings-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {dataMessage && <p className="form-success" style={{ textAlign: "center" }}>{dataMessage}</p>}
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={handleExportTasks}
          >
            Export Tasks (JSON Backup)
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportTasks}
            accept=".json"
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Tasks (JSON Backup)
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={() => setShowClearTasksConfirm(true)}
            style={{ color: "var(--danger)" }}
          >
            Clear All Tasks
          </button>
        </div>
      </section>

      {/* Account Actions Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Account</h2>
        <div className="settings-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={logout}
          >
            Sign Out
          </button>
          <button
            type="button"
            className="btn btn-danger btn-full"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">About</h2>
        <div className="settings-card">
          <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="settings-row-label">Version</span>
            <span className="settings-row-sub">{APP_VERSION}</span>
          </div>
          <div className="settings-row" style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="settings-row-label">Architecture</span>
            <span className="settings-row-sub">React 18 + Local Storage + Capacitor</span>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={showClearTasksConfirm}
        title="Clear All Tasks"
        message="Are you sure you want to delete all your tasks? This cannot be undone."
        confirmLabel="Clear All"
        onConfirm={handleClearTasks}
        onCancel={() => setShowClearTasksConfirm(false)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Account"
        message="Deleting your account will permanently remove your user credentials, profile, and all tasks from this device. Are you sure?"
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

