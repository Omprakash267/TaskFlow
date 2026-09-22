import { PRIORITY_WEIGHT } from "../constants/index.js";

/**
 * Parse a date string (especially YYYY-MM-DD) into a local Date object
 * without suffering from UTC-to-local timezone day-shift bugs.
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  if (typeof dateString === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  return new Date(dateString);
};

/**
 * Format a date string for display (YYYY-MM-DD or ISO)
 */
export const formatDate = (dateString) => {
  if (!dateString) return "No due date";
  const date = parseLocalDate(dateString);
  if (!date || isNaN(date.getTime())) return "Invalid date";

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

/**
 * Format a datetime for reminder display
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/**
 * Check if two dates are the same calendar day in local time
 */
export const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = parseLocalDate(d1);
  const date2 = parseLocalDate(d2);
  if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if a date is today
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  return isSameDay(parseLocalDate(dateString), new Date());
};

/**
 * Check if a task is overdue
 */
export const isOverdue = (task) => {
  if (!task || !task.dueDate || task.completed) return false;
  const due = parseLocalDate(task.dueDate);
  if (!due || isNaN(due.getTime())) return false;

  // Set to end of the due day in local time
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
};

/**
 * Check if a date is upcoming (after today)
 */
export const isUpcoming = (dateString) => {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (!date || isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  date.setHours(23, 59, 59, 999);
  return date.getTime() > today.getTime();
};

/**
 * Get a friendly greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

/**
 * Get today's date formatted nicely for dashboard headers
 */
export const getTodayFormatted = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

/**
 * Map authentication error codes to user-friendly messages
 */
export const getAuthErrorMessage = (errorOrCode) => {
  const errorCode = typeof errorOrCode === "string" ? errorOrCode : errorOrCode?.code;
  const rawMessage = typeof errorOrCode === "object" ? errorOrCode?.message : "";

  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/user-disabled": "This account has been disabled.",
  };

  if (errorCode && messages[errorCode]) {
    return messages[errorCode];
  }

  return rawMessage || "An unexpected error occurred. Please try again.";
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
  return typeof password === "string" && password.length >= 6;
};

/**
 * Validate task input
 */
export const validateTask = (taskData, options = {}) => {
  const errors = {};
  const trimmedTitle = taskData.title?.trim();

  if (!trimmedTitle) {
    errors.title = "Task title is required.";
  } else if (trimmedTitle.length > 200) {
    errors.title = "Task title must be under 200 characters.";
  }

  if (taskData.description && taskData.description.length > 1000) {
    errors.description = "Description must be under 1000 characters.";
  }

  if (taskData.reminderTime) {
    const reminderDate = new Date(taskData.reminderTime);
    if (isNaN(reminderDate.getTime())) {
      errors.reminderTime = "Invalid reminder date/time.";
    } else {
      // If editing and reminder was not modified, allow preserving existing reminder
      const isUnchangedReminder = Boolean(options.isEdit && taskData.reminderTime === options.initialReminderTime);
      if (!isUnchangedReminder && reminderDate.getTime() <= Date.now()) {
        errors.reminderTime = "Reminder must be scheduled in the future.";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get checklist progress information for a task
 */
export const getChecklistProgress = (task) => {
  const items = Array.isArray(task?.checklist) ? task.checklist : [];
  const total = items.length;
  if (total === 0) return { total: 0, completed: 0, percent: 0 };
  const completed = items.filter((item) => item.completed).length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, percent };
};

/**
 * Get next recurring date based on recurrence pattern
 */
export const getNextRecurringDate = (currentDueDateStr, recurrenceType) => {
  const base = currentDueDateStr ? parseLocalDate(currentDueDateStr) : new Date();
  if (!base || isNaN(base.getTime())) return null;

  const next = new Date(base);

  switch (recurrenceType) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekdays": {
      const day = next.getDay();
      if (day === 5) {
        next.setDate(next.getDate() + 3); // Fri -> Mon
      } else if (day === 6) {
        next.setDate(next.getDate() + 2); // Sat -> Mon
      } else {
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      return null;
  }

  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const date = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

/**
 * Normalize a task object with safe defaults for missing fields
 */
export const normalizeTask = (task) => {
  if (!task) return null;
  return {
    id: task.id || "",
    userId: task.userId || "",
    title: task.title || "Untitled Task",
    description: task.description || "",
    category: task.category || "Other",
    priority: task.priority || "Medium",
    dueDate: task.dueDate || null,
    completed: Boolean(task.completed),
    isPinned: Boolean(task.isPinned),
    recurring: task.recurring || "none",
    tags: Array.isArray(task.tags) ? task.tags : [],
    reminderTime: task.reminderTime || null,
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    ...task,
  };
};

/**
 * Filter tasks based on selected filter type
 */
export const filterTasks = (tasks, filter) => {
  if (!Array.isArray(tasks)) return [];
  switch (filter) {
    case "pinned":
      return tasks.filter((t) => t.isPinned && !t.completed);
    case "today":
      return tasks.filter((t) => t.dueDate && isToday(t.dueDate));
    case "upcoming":
      return tasks.filter((t) => t.dueDate && isUpcoming(t.dueDate) && !t.completed);
    case "overdue":
      return tasks.filter((t) => isOverdue(t));
    case "completed":
      return tasks.filter((t) => t.completed);
    case "pending":
      return tasks.filter((t) => !t.completed);
    case "high":
      return tasks.filter((t) => t.priority === "High" && !t.completed);
    case "all":
    default:
      return tasks;
  }
};

/**
 * Sort tasks based on sort option with Pinned tasks prioritized to top
 */
export const sortTasks = (tasks, sortBy = "createdAt_desc") => {
  if (!Array.isArray(tasks)) return [];
  const sorted = [...tasks];
  const [field, direction] = sortBy.split("_");
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    // Pinned tasks always bubble up (unless both or neither are pinned)
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }

    switch (field) {
      case "createdAt": {
        const aParsed = a.createdAt ? new Date(a.createdAt) : null;
        const bParsed = b.createdAt ? new Date(b.createdAt) : null;
        const aTime = aParsed && !isNaN(aParsed.getTime()) ? aParsed.getTime() : 0;
        const bTime = bParsed && !isNaN(bParsed.getTime()) ? bParsed.getTime() : 0;
        return (aTime - bTime) * dir;
      }
      case "dueDate": {
        const aParsed = a.dueDate ? parseLocalDate(a.dueDate) : null;
        const bParsed = b.dueDate ? parseLocalDate(b.dueDate) : null;
        const aTime = aParsed && !isNaN(aParsed.getTime()) ? aParsed.getTime() : (dir === 1 ? Infinity : -Infinity);
        const bTime = bParsed && !isNaN(bParsed.getTime()) ? bParsed.getTime() : (dir === 1 ? Infinity : -Infinity);
        return (aTime - bTime) * dir;
      }
      case "priority": {
        const aW = PRIORITY_WEIGHT[a.priority] || 0;
        const bW = PRIORITY_WEIGHT[b.priority] || 0;
        return (aW - bW) * dir;
      }
      default:
        return 0;
    }
  });
  return sorted;
};

/**
 * Search tasks by query string across title, description, category, checklist, and tags
 */
export const searchTasks = (tasks, query) => {
  if (!Array.isArray(tasks)) return [];
  if (!query || !query.trim()) return tasks;
  const q = query.toLowerCase().trim();
  return tasks.filter(
    (t) =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (Array.isArray(t.tags) && t.tags.some((tag) => tag && tag.toLowerCase().includes(q))) ||
      (Array.isArray(t.checklist) &&
        t.checklist.some((item) => item?.text && item.text.toLowerCase().includes(q)))
  );
};

/**
 * Calculate user productivity streak & daily completed count
 */
export const calculateStreak = (todos) => {
  if (!Array.isArray(todos) || todos.length === 0) {
    return { currentStreak: 0, bestStreak: 0, completedToday: 0 };
  }

  const completionDates = new Set();
  let completedToday = 0;
  const today = new Date();
  const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (const t of todos) {
    if (!t.completed) continue;
    const timestamp = t.updatedAt || t.createdAt;
    if (!timestamp) continue;
    const dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) continue;

    const ymd = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    completionDates.add(ymd);
    if (ymd === todayYMD) {
      completedToday++;
    }
  }

  if (completionDates.size === 0) {
    return { currentStreak: 0, bestStreak: 0, completedToday };
  }

  // Check current streak backwards from today (or yesterday if today not done yet)
  let currentStreak = 0;
  let cursor = new Date(today);
  if (!completionDates.has(todayYMD)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const ymd = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (completionDates.has(ymd)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best historic streak
  const sortedDates = Array.from(completionDates)
    .map((d) => parseLocalDate(d))
    .filter((d) => d && !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  let bestStreak = 0;
  let running = 0;
  let prevTime = null;

  for (const d of sortedDates) {
    if (prevTime === null) {
      running = 1;
    } else {
      const diffDays = Math.round((d.getTime() - prevTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running++;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    prevTime = d.getTime();
    if (running > bestStreak) {
      bestStreak = running;
    }
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak), completedToday };
};

/**
 * Get day abbreviation from index (0 = Sun, 6 = Sat)
 */
export const getDayName = (index) => {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index] || "";
};

/**
 * Get start of current week (Monday)
 */
export const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};