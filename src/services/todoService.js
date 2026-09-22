import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  generateId,
  dbEvents,
} from "./localDb.js";
import { normalizeTask, getNextRecurringDate } from "../utils/helpers.js";
import { cancelReminder, scheduleReminder } from "./notificationService.js";

/**
 * Get all tasks for a specific user
 */
export const getUserTodos = (userId) => {
  if (!userId) return [];
  const allTodos = getStorageItem(STORAGE_KEYS.TODOS, []);
  return allTodos
    .filter((t) => t && t.userId === userId)
    .map((t) => normalizeTask(t))
    .sort((a, b) => {
      // Pinned tasks first
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
};

/**
 * Subscribe to real-time todo updates for a user.
 * Returns an unsubscribe function.
 */
export const subscribeToTodos = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Initial data dispatch
  callback(getUserTodos(userId));

  // Listen for local mutations
  const unsubscribe = dbEvents.on("todos_change", () => {
    callback(getUserTodos(userId));
  });

  return unsubscribe;
};

/**
 * Create a new todo task
 */
export const createTodo = async (userId, taskData) => {
  if (!userId) {
    throw new Error("Cannot create a task without a valid user ID.");
  }

  const trimmedTitle = taskData.title ? taskData.title.trim() : "";
  if (!trimmedTitle) {
    throw new Error("Task title is required.");
  }

  const allTodos = [...getStorageItem(STORAGE_KEYS.TODOS, [])];
  const newId = generateId("task");
  const nowIso = new Date().toISOString();

  const newTask = {
    id: newId,
    userId,
    title: trimmedTitle,
    description: taskData.description ? taskData.description.trim() : "",
    category: taskData.category || "Other",
    priority: taskData.priority || "Medium",
    dueDate: taskData.dueDate || null,
    completed: false,
    isPinned: Boolean(taskData.isPinned),
    recurring: taskData.recurring || "none",
    tags: Array.isArray(taskData.tags) ? taskData.tags : [],
    reminderTime: taskData.reminderTime || null,
    checklist: Array.isArray(taskData.checklist) ? taskData.checklist : [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  allTodos.unshift(newTask);
  setStorageItem(STORAGE_KEYS.TODOS, allTodos);
  dbEvents.emit("todos_change", allTodos);

  return newTask;
};

/**
 * Update an existing todo task
 */
export const updateTodo = async (id, updatedData) => {
  if (!id) return null;

  const allTodos = [...getStorageItem(STORAGE_KEYS.TODOS, [])];
  const index = allTodos.findIndex((t) => t.id === id);

  if (index !== -1) {
    const existing = allTodos[index];
    const updatedTask = {
      ...existing,
      ...updatedData,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allTodos[index] = updatedTask;
    setStorageItem(STORAGE_KEYS.TODOS, allTodos);
    dbEvents.emit("todos_change", allTodos);
    return updatedTask;
  }
  return null;
};

/**
 * Toggle pinned status of a task
 */
export const togglePinTask = async (id) => {
  if (!id) return null;
  const allTodos = getStorageItem(STORAGE_KEYS.TODOS, []);
  const target = allTodos.find((t) => t.id === id);
  if (!target) return null;
  return updateTodo(id, { isPinned: !target.isPinned });
};

/**
 * Toggle a single checklist item on a task
 */
export const toggleChecklistItem = async (taskId, checklistItemId) => {
  if (!taskId || !checklistItemId) return null;

  const allTodos = [...getStorageItem(STORAGE_KEYS.TODOS, [])];
  const index = allTodos.findIndex((t) => t.id === taskId);
  if (index === -1) return null;

  const existing = allTodos[index];
  const checklist = Array.isArray(existing.checklist) ? [...existing.checklist] : [];
  const itemIndex = checklist.findIndex((item) => item.id === checklistItemId);
  if (itemIndex === -1) return null;

  checklist[itemIndex] = {
    ...checklist[itemIndex],
    completed: !checklist[itemIndex].completed,
  };

  const updatedTask = {
    ...existing,
    checklist,
    updatedAt: new Date().toISOString(),
  };

  allTodos[index] = updatedTask;
  setStorageItem(STORAGE_KEYS.TODOS, allTodos);
  dbEvents.emit("todos_change", allTodos);
  return updatedTask;
};

/**
 * Delete a todo task and cancel its reminder
 */
export const deleteTodo = async (id) => {
  if (!id) return;
  cancelReminder(id).catch(() => {});

  const allTodos = [...getStorageItem(STORAGE_KEYS.TODOS, [])];
  const filtered = allTodos.filter((t) => t.id !== id);
  setStorageItem(STORAGE_KEYS.TODOS, filtered);
  dbEvents.emit("todos_change", filtered);
};

/**
 * Restore a deleted task (Undo support)
 */
export const restoreTodo = async (task) => {
  if (!task || !task.userId) return null;
  const allTodos = [...getStorageItem(STORAGE_KEYS.TODOS, [])];
  const existingIdx = allTodos.findIndex((t) => t.id === task.id);
  if (existingIdx !== -1) {
    allTodos[existingIdx] = { ...task };
  } else {
    allTodos.unshift({ ...task });
  }
  setStorageItem(STORAGE_KEYS.TODOS, allTodos);
  dbEvents.emit("todos_change", allTodos);
  return task;
};

/**
 * Toggle completion status of a todo
 * If the task is recurring and not yet completed, completing it automatically
 * calculates and sets the next cycle's due date and resets checklist subtasks.
 */
export const toggleTodoComplete = async (todo) => {
  if (!todo || !todo.id) return null;

  // Handle recurring task cycle advancement
  if (!todo.completed && todo.recurring && todo.recurring !== "none") {
    const nextDueDate = getNextRecurringDate(todo.dueDate, todo.recurring);
    const resetChecklist = Array.isArray(todo.checklist)
      ? todo.checklist.map((item) => ({ ...item, completed: false }))
      : [];

    const updated = await updateTodo(todo.id, {
      dueDate: nextDueDate,
      checklist: resetChecklist,
      completed: false, // Rolls forward to next cycle
      updatedAt: new Date().toISOString(),
    });

    return { ...updated, _recurringAdvanced: true, nextDueDate };
  }

  const willBeCompleted = !todo.completed;

  // Immediately persist update to database and emit reactive change
  const updated = await updateTodo(todo.id, { completed: willBeCompleted });

  // Handle notification cancellation/scheduling in the background without delaying UI
  if (willBeCompleted) {
    cancelReminder(todo.id).catch(() => {});
  } else if (todo.reminderTime) {
    scheduleReminder(todo).catch(() => {});
  }

  return updated;
};

/**
 * Clear all tasks for a specific user
 */
export const clearAllUserTodos = async (userId) => {
  if (!userId) return;

  const allTodos = getStorageItem(STORAGE_KEYS.TODOS, []);
  const userTodos = allTodos.filter((t) => t.userId === userId);

  // Cancel any scheduled reminders
  for (const t of userTodos) {
    if (t.reminderTime) {
      await cancelReminder(t.id);
    }
  }

  const remainingTodos = allTodos.filter((t) => t.userId !== userId);
  setStorageItem(STORAGE_KEYS.TODOS, remainingTodos);
  dbEvents.emit("todos_change", remainingTodos);
};