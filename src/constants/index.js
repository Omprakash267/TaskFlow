// Categories for task organization
export const CATEGORIES = [
  { value: "Work", label: "💼 Work", color: "#0284c7" },
  { value: "Study", label: "📚 Study", color: "#2563eb" },
  { value: "Personal", label: "👤 Personal", color: "#059669" },
  { value: "Shopping", label: "🛒 Shopping", color: "#d97706" },
  { value: "Sports", label: "⚽ Sports", color: "#16a34a" },
  { value: "Other", label: "📌 Other", color: "#64748b" },
];

// Priority levels
export const PRIORITIES = [
  { value: "High", label: "High", color: "#e11d48" },
  { value: "Medium", label: "Medium", color: "#d97706" },
  { value: "Low", label: "Low", color: "#059669" },
];


// Recurrence options for repeating tasks
export const RECURRENCE_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "🔁 Daily" },
  { value: "weekdays", label: "🏢 Weekdays (Mon-Fri)" },
  { value: "weekly", label: "📅 Weekly" },
  { value: "monthly", label: "🗓️ Monthly" },
];

// Suggested quick tags
export const POPULAR_TAGS = ["urgent", "focus", "quick", "errand", "health", "finance", "idea"];

// Filter options for task list
export const FILTERS = [
  { value: "all", label: "All" },
  { value: "pinned", label: "⭐ Pinned" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "high", label: "High Priority" },
];

// Sort options
export const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc", label: "Oldest First" },
  { value: "dueDate_asc", label: "Due Date (Earliest)" },
  { value: "dueDate_desc", label: "Due Date (Latest)" },
  { value: "priority_desc", label: "Priority (High → Low)" },
  { value: "priority_asc", label: "Priority (Low → High)" },
];

// Priority weight for sorting
export const PRIORITY_WEIGHT = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// Daily target goal default
export const DEFAULT_DAILY_GOAL = 3;

// App metadata
export const APP_VERSION = "2.1.0";
export const APP_NAME = "TaskFlow";
