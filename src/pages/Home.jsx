import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useTodos from "../hooks/useTodos";
import useOnlineStatus from "../hooks/useOnlineStatus";
import StatCard from "../components/StatCard";
import TaskList from "../components/TaskList";
import TaskForm from "../components/TaskForm";
import ConfirmDialog from "../components/ConfirmDialog";
import Loading from "../components/Loading";
import Scratchpad from "../components/Scratchpad";
import {
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoComplete,
  toggleChecklistItem,
  togglePinTask,
  restoreTodo,
} from "../services/todoService";
import { scheduleReminder, cancelReminder } from "../services/notificationService";
import { getGreeting, getTodayFormatted, isToday, isUpcoming, isOverdue } from "../utils/helpers";
import { DEFAULT_DAILY_GOAL } from "../constants";

export default function Home() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { todos, stats, streakInfo, loading } = useTodos(user?.uid);
  const isOnline = useOnlineStatus();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Friend";

  const pinnedTasks = useMemo(() => {
    return todos.filter((t) => t.isPinned && !t.completed);
  }, [todos]);

  const overdueTasks = useMemo(() => {
    return todos.filter((t) => isOverdue(t) && !t.isPinned);
  }, [todos]);

  const todayTasks = useMemo(() => {
    return todos.filter((t) => t.dueDate && isToday(t.dueDate) && !t.completed && !t.isPinned);
  }, [todos]);

  const upcomingTasks = useMemo(() => {
    return todos.filter((t) => t.dueDate && isUpcoming(t.dueDate) && !t.completed && !t.isPinned).slice(0, 5);
  }, [todos]);

  const otherTasks = useMemo(() => {
    return todos.filter((t) => !t.dueDate && !t.completed && !t.isPinned).slice(0, 5);
  }, [todos]);

  const handleAddTask = useCallback((taskData) => {
    if (!user?.uid) return;
    setShowForm(false);

    createTodo(user.uid, taskData)
      .then((created) => {
        showToast(`Created "${taskData.title}"`);
        if (taskData.reminderTime && created?.id) {
          scheduleReminder({ ...taskData, id: created.id }).catch((err) => {
            console.warn("Could not schedule reminder:", err);
          });
        }
      })
      .catch((err) => {
        console.error("Error adding task:", err);
      });
  }, [user?.uid, showToast]);

  const handleEditTask = useCallback((taskData) => {
    if (!editingTask) return;
    const taskBeingEdited = editingTask;
    setEditingTask(null);

    const { id, ...data } = taskData;
    updateTodo(taskBeingEdited.id, data)
      .then(() => {
        showToast("Task updated");
        if (taskData.reminderTime) {
          scheduleReminder({ ...taskData, id: taskBeingEdited.id }).catch((err) => {
            console.warn("Could not update reminder:", err);
          });
        } else {
          cancelReminder(taskBeingEdited.id).catch(() => {});
        }
      })
      .catch((err) => {
        console.error("Error editing task:", err);
      });
  }, [editingTask, showToast]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingTask) return;
    const taskToDelete = deletingTask;
    setDeletingTask(null);

    deleteTodo(taskToDelete.id)
      .then(() => {
        showToast(`Deleted "${taskToDelete.title}"`, {
          actionLabel: "Undo",
          onAction: () => restoreTodo(taskToDelete),
        });
      })
      .catch((err) => {
        console.error("Error deleting task:", err);
      });
  }, [deletingTask, showToast]);

  const handlePinTask = useCallback((task) => {
    togglePinTask(task.id).catch((err) => {
      console.error("Error pinning task:", err);
    });
  }, []);

  const handleToggle = useCallback((task) => {
    toggleTodoComplete(task)
      .then((res) => {
        if (res?._recurringAdvanced) {
          showToast(`🔁 Recurring task rolled forward to ${res.nextDueDate}`);
        } else if (!task.completed) {
          showToast(`Marked "${task.title}" as completed`, {
            actionLabel: "Undo",
            onAction: () => toggleTodoComplete(task),
          });
        }
      })
      .catch((err) => {
        console.error("Error toggling task:", err);
      });
  }, [showToast]);

  const handleToggleChecklistItem = useCallback((taskId, itemId) => {
    toggleChecklistItem(taskId, itemId).catch((err) => {
      console.error("Error toggling checklist item:", err);
    });
  }, []);

  if (loading) return <Loading message="Loading your dashboard..." />;

  const dailyGoalPct = Math.min(Math.round((streakInfo.completedToday / DEFAULT_DAILY_GOAL) * 100), 100);

  return (
    <div className="page home-page">
      {!isOnline && (
        <div className="offline-banner" role="alert">
          📡 Offline Mode — All your data is saved locally on this device
        </div>
      )}

      <div className="greeting-section">
        <div className="greeting-top-row">
          <div>
            <h1 className="greeting-text">
              {getGreeting()} 👋
            </h1>
            <p className="greeting-name">{displayName}</p>
            <p className="greeting-date">{getTodayFormatted()}</p>
          </div>

          <div className="streak-goal-container">
            <div className="streak-card" title="Daily completion streak">
              <span className="streak-icon">🔥</span>
              <div className="streak-details">
                <span className="streak-number">{streakInfo.currentStreak}</span>
                <span className="streak-sub">day streak</span>
              </div>
            </div>

            <div className="goal-card" title="Daily target goal">
              <div className="goal-header">
                <span className="goal-title">🎯 Daily Goal</span>
                <span className="goal-count">{streakInfo.completedToday}/{DEFAULT_DAILY_GOAL}</span>
              </div>
              <div className="goal-progress-track">
                <div className="goal-progress-fill" style={{ width: `${dailyGoalPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid" role="region" aria-label="Task Summary">
        <StatCard label="Total" value={stats.total} color="#6366f1" icon="📋" />
        <StatCard label="Done" value={stats.completed} color="#22c55e" icon="✅" />
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" icon="⏳" />
        <StatCard label="Overdue" value={stats.overdue} color="#ef4444" icon="🔴" />
      </div>

      <Scratchpad userId={user?.uid} />

      {pinnedTasks.length > 0 && (
        <section className="home-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="section-title" style={{ color: "#d97706" }}>⭐ Pinned Focus</h2>
            <span className="section-badge" style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: 600 }}>
              {pinnedTasks.length} pinned
            </span>
          </div>
          <TaskList
            tasks={pinnedTasks}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onPin={handlePinTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            emptyTitle="No pinned tasks"
          />
        </section>
      )}

      {overdueTasks.length > 0 && (
        <section className="home-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="section-title" style={{ color: "var(--danger, #ef4444)" }}>⚠️ Overdue Tasks</h2>
            <span className="section-badge" style={{ fontSize: "0.85rem", color: "var(--danger, #ef4444)", fontWeight: 600 }}>
              {overdueTasks.length} overdue
            </span>
          </div>
          <TaskList
            tasks={overdueTasks}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onPin={handlePinTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            emptyTitle="No overdue tasks"
          />
        </section>
      )}

      {todayTasks.length > 0 && (
        <section className="home-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="section-title">Today's Tasks</h2>
            <span className="section-badge" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {todayTasks.length} pending
            </span>
          </div>
          <TaskList
            tasks={todayTasks}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onPin={handlePinTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            emptyTitle="No tasks for today"
          />
        </section>
      )}

      {upcomingTasks.length > 0 && (
        <section className="home-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="section-title">Upcoming</h2>
            <span className="section-badge" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Next {upcomingTasks.length}
            </span>
          </div>
          <TaskList
            tasks={upcomingTasks}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onPin={handlePinTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            emptyTitle="No upcoming tasks"
          />
        </section>
      )}

      {otherTasks.length > 0 && (
        <section className="home-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="section-title">Other Pending Tasks</h2>
            <span className="section-badge" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {otherTasks.length} pending
            </span>
          </div>
          <TaskList
            tasks={otherTasks}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onPin={handlePinTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            emptyTitle="No other pending tasks"
          />
        </section>
      )}

      {todos.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3 className="empty-state-title">No tasks yet</h3>
          <p className="empty-state-subtitle">Tap the + button to create your first task</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ marginTop: "16px" }}
          >
            Create First Task
          </button>
        </div>
      )}

      {todos.length > 0 &&
        overdueTasks.length === 0 &&
        todayTasks.length === 0 &&
        upcomingTasks.length === 0 &&
        otherTasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3 className="empty-state-title">All caught up!</h3>
            <p className="empty-state-subtitle">All your tasks have been completed!</p>
          </div>
      )}

      <button
        type="button"
        className="fab"
        onClick={() => setShowForm(true)}
        aria-label="Add new task"
      >
        +
      </button>

      <TaskForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleAddTask}
      />

      <TaskForm
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditTask}
        initialData={editingTask}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}