import { memo, useState } from "react";
import { formatDate, formatDateTime, isOverdue } from "../utils/helpers";
import { CATEGORIES, PRIORITIES } from "../constants";
import { toggleChecklistItem, togglePinTask } from "../services/todoService";

function TaskCard({ task, onToggle, onEdit, onDelete, onPin, onToggleChecklistItem }) {
  const [showChecklist, setShowChecklist] = useState(true);

  if (!task) return null;

  const overdue = isOverdue(task);
  const priorityInfo = PRIORITIES.find((p) => p.value === task.priority) || { label: "Medium", color: "#f59e0b" };
  const categoryInfo = CATEGORIES.find((c) => c.value === task.category);

  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((i) => i.completed).length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const handleSubtaskToggle = (itemId) => {
    if (onToggleChecklistItem) {
      onToggleChecklistItem(task.id, itemId);
    } else {
      toggleChecklistItem(task.id, itemId);
    }
  };

  const handlePinToggle = (e) => {
    e.stopPropagation();
    if (onPin) {
      onPin(task);
    } else {
      togglePinTask(task.id);
    }
  };

  const recurrenceLabel =
    task.recurring === "daily"
      ? "Daily"
      : task.recurring === "weekdays"
      ? "Weekdays"
      : task.recurring === "weekly"
      ? "Weekly"
      : task.recurring === "monthly"
      ? "Monthly"
      : null;

  return (
    <div
      className={`task-card ${task.completed ? "task-completed" : ""} ${overdue ? "task-overdue" : ""} ${task.isPinned ? "task-pinned" : ""}`}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card-left">
        <button
          type="button"
          className={`task-check ${task.completed ? "task-check-done" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task);
          }}
          aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
        >
          {task.completed && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>

      <div
        className="task-card-content"
        onClick={() => onEdit(task)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onEdit(task);
          }
        }}
        aria-label={`Edit task: ${task.title}`}
      >
        <div className="task-card-header">
          <h3 className={`task-title ${task.completed ? "completed-text" : ""}`}>
            {task.isPinned && <span className="task-pinned-icon" title="Pinned task">⭐ </span>}
            {task.title}
          </h3>
          <div className="task-card-header-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`task-pin-btn ${task.isPinned ? "task-pin-active" : ""}`}
              onClick={handlePinToggle}
              title={task.isPinned ? "Unpin task" : "Pin to top"}
              aria-label={task.isPinned ? "Unpin task" : "Pin task to top"}
            >
              {task.isPinned ? "★" : "☆"}
            </button>
            <span
              className="task-priority-dot"
              style={{ backgroundColor: priorityInfo.color }}
              title={`${task.priority} priority`}
              aria-label={`${task.priority} priority`}
            />
          </div>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        {/* Checklist Progress & Subtasks */}
        {checklistTotal > 0 && (
          <div
            className="task-card-checklist"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="task-checklist-header"
              onClick={() => setShowChecklist((prev) => !prev)}
            >
              <div className="task-checklist-title-row">
                <span className="task-checklist-badge">
                  ☑️ {checklistDone}/{checklistTotal} ({checklistPercent}%)
                </span>
                <span className="task-checklist-toggle-btn">
                  {showChecklist ? "▲ Hide" : "▼ Show"}
                </span>
              </div>
              <div className="task-checklist-bar-bg">
                <div
                  className="task-checklist-bar-fill"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
            </div>

            {showChecklist && (
              <div className="task-checklist-items">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="task-checklist-item"
                    onClick={() => handleSubtaskToggle(item.id)}
                  >
                    <button
                      type="button"
                      className={`checklist-item-check-btn ${item.completed ? "checklist-check-done" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtaskToggle(item.id);
                      }}
                      aria-label={item.completed ? `Mark "${item.text}" incomplete` : `Mark "${item.text}" complete`}
                    >
                      {item.completed && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`checklist-item-text ${item.completed ? "completed-text" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="task-meta">
          {categoryInfo && (
            <span
              className="task-category-badge"
              style={{
                color: categoryInfo.color,
                background: `${categoryInfo.color}18`,
                borderColor: `${categoryInfo.color}35`,
              }}
            >
              {categoryInfo.label}
            </span>
          )}

          {recurrenceLabel && (
            <span className="task-recurrence-badge" title={`Repeats: ${recurrenceLabel}`}>
              🔁 {recurrenceLabel}
            </span>
          )}

          {Array.isArray(task.tags) &&
            task.tags.map((tag) => (
              <span key={tag} className="task-tag-badge">
                #{tag}
              </span>
            ))}

          {task.dueDate && (
            <span className={`task-due ${overdue ? "task-due-overdue" : ""}`}>
              📅 {formatDate(task.dueDate)}
              {overdue && " · Overdue"}
            </span>
          )}

          {task.reminderTime && !task.completed && (
            <span className="task-reminder-badge" title={`Reminder: ${formatDateTime(task.reminderTime)}`}>
              ⏰ {formatDateTime(task.reminderTime)}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="task-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task);
        }}
        aria-label={`Delete task: ${task.title}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

export default memo(TaskCard);

