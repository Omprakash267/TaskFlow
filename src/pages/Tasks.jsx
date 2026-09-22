import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useTodos from "../hooks/useTodos";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import TaskList from "../components/TaskList";
import TaskForm from "../components/TaskForm";
import ConfirmDialog from "../components/ConfirmDialog";
import Loading from "../components/Loading";
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

export default function Tasks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    todos,
    filteredTodos,
    loading,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    availableTags,
    selectedTag,
    setSelectedTag,
    stats,
  } = useTodos(user?.uid);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

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

  if (loading) return <Loading message="Loading tasks..." />;

  const getEmptyMessage = () => {
    if (search.trim()) {
      return {
        title: "No matching tasks",
        subtitle: `No tasks found matching "${search}"`,
        icon: "🔍",
      };
    }
    if (selectedTag) {
      return {
        title: `No tasks tagged #${selectedTag}`,
        subtitle: `Select "All Tags" to view other tasks`,
        icon: "🏷️",
      };
    }
    if (filter === "pinned") {
      return {
        title: "No pinned tasks",
        subtitle: "Click the star icon on any task to pin it to top",
        icon: "⭐",
      };
    }
    if (filter === "completed") {
      return {
        title: "No completed tasks",
        subtitle: "Tasks marked as done will appear here",
        icon: "✅",
      };
    }
    if (filter === "pending") {
      return {
        title: "No pending tasks",
        subtitle: "All your tasks are completed!",
        icon: "🎉",
      };
    }
    if (filter === "today") {
      return {
        title: "No tasks due today",
        subtitle: "Enjoy your free time or add a new task",
        icon: "☀️",
      };
    }
    if (filter === "upcoming") {
      return {
        title: "No upcoming tasks",
        subtitle: "Plan ahead by setting future due dates",
        icon: "📅",
      };
    }
    if (filter === "overdue") {
      return {
        title: "No overdue tasks",
        subtitle: "Great job staying on schedule!",
        icon: "👏",
      };
    }
    if (filter === "high") {
      return {
        title: "No high priority tasks",
        subtitle: "No urgent items pending",
        icon: "🔥",
      };
    }
    return {
      title: "No tasks found",
      subtitle: "Tap the + button to create your first task",
      icon: "📋",
    };
  };

  const emptyInfo = getEmptyMessage();

  return (
    <div className="page tasks-page">
      <Header
        title="Tasks"
        rightAction={
          <span className="header-badge" title="Total tasks">
            {filteredTodos.length} / {stats.total}
          </span>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search title, description, category, or #tag..." />

      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        availableTags={availableTags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
      />

      <TaskList
        tasks={filteredTodos}
        onToggle={handleToggle}
        onEdit={setEditingTask}
        onDelete={setDeletingTask}
        onPin={handlePinTask}
        onToggleChecklistItem={handleToggleChecklistItem}
        emptyTitle={emptyInfo.title}
        emptySubtitle={emptyInfo.subtitle}
        emptyIcon={emptyInfo.icon}
        emptyActionLabel={!search && !selectedTag && filter === "all" && todos.length === 0 ? "Add First Task" : ""}
        onEmptyAction={!search && !selectedTag && filter === "all" && todos.length === 0 ? () => setShowForm(true) : null}
      />

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

