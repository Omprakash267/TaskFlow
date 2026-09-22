import { useState, useEffect } from "react";
import { CATEGORIES, PRIORITIES, RECURRENCE_OPTIONS, POPULAR_TAGS } from "../constants";
import { validateTask } from "../utils/helpers";

export default function TaskForm({ open, onClose, onSubmit, initialData = null, loading = false }) {
  const isEdit = Boolean(initialData && initialData.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [recurring, setRecurring] = useState("none");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [error, setError] = useState("");

  // Populate or reset form whenever modal opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setCategory(initialData.category || "Other");
        setPriority(initialData.priority || "Medium");
        setDueDate(initialData.dueDate || "");
        setReminderTime(initialData.reminderTime || "");
        setIsPinned(Boolean(initialData.isPinned));
        setRecurring(initialData.recurring || "none");
        setTags(Array.isArray(initialData.tags) ? [...initialData.tags] : []);
        setChecklist(
          Array.isArray(initialData.checklist)
            ? initialData.checklist.map((item) => ({ ...item }))
            : []
        );
      } else {
        setTitle("");
        setDescription("");
        setCategory("Other");
        setPriority("Medium");
        setDueDate("");
        setReminderTime("");
        setIsPinned(false);
        setRecurring("none");
        setTags([]);
        setChecklist([]);
      }
      setTagInput("");
      setNewChecklistText("");
      setError("");
    }
  }, [open, initialData]);

  // Handle adding a subtask to checklist
  const handleAddChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    const newItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: trimmed,
      completed: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistText("");
  };

  // Handle adding a tag
  const handleAddTag = (tagToAdd) => {
    const cleanTag = (tagToAdd || tagInput).trim().toLowerCase().replace(/^#/, "");
    if (!cleanTag) return;
    if (!tags.includes(cleanTag) && tags.length < 8) {
      setTags((prev) => [...prev, cleanTag]);
    }
    setTagInput("");
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Handle toggling subtask in form
  const handleToggleChecklistItem = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
  };

  // Handle deleting subtask in form
  const handleDeleteChecklistItem = (index) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const taskPayload = {
      title,
      description,
      category,
      priority,
      dueDate: dueDate || null,
      reminderTime: reminderTime || null,
      isPinned,
      recurring,
      tags,
      checklist,
    };

    const validation = validateTask(taskPayload, {
      isEdit,
      initialReminderTime: initialData?.reminderTime,
    });
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return;
    }

    onSubmit({
      ...(initialData || {}),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      dueDate: dueDate || null,
      reminderTime: reminderTime || null,
      isPinned,
      recurring,
      tags,
      checklist,
    });
  };

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className="task-form-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="task-form-header">
          <h2 id="task-form-title">{isEdit ? "Edit Task" : "New Task"}</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close form"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label htmlFor="task-title" style={{ marginBottom: 0 }}>Title *</label>
              <button
                type="button"
                className={`pin-form-btn ${isPinned ? "pin-form-active" : ""}`}
                onClick={() => setIsPinned((prev) => !prev)}
                aria-pressed={isPinned}
                title={isPinned ? "Pinned to top" : "Click to pin to top"}
              >
                {isPinned ? "⭐ Pinned to Top" : "☆ Pin to Top"}
              </button>
            </div>
            <input
              id="task-title"
              type="text"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              placeholder="Add details, notes, or subtasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={1000}
            />
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="task-category">Category</label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-group-half">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-group-third">
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.target.showPicker?.();
                  } catch {
                    // Ignore showPicker restrictions
                  }
                }}
                style={{ cursor: "pointer" }}
              />
            </div>

            <div className="form-group form-group-third">
              <label htmlFor="task-recurring">Repeat</label>
              <select
                id="task-recurring"
                value={recurring}
                onChange={(e) => setRecurring(e.target.value)}
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-group-third">
              <label htmlFor="task-reminder">Reminder</label>
              <input
                id="task-reminder"
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => {
                  setReminderTime(e.target.value);
                  if (error) setError("");
                }}
                onClick={(e) => {
                  try {
                    e.target.showPicker?.();
                  } catch {
                    // Ignore showPicker restrictions
                  }
                }}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Tags & Labels Section */}
          <div className="form-group tags-form-group">
            <label>Tags & Labels</label>
            {tags.length > 0 && (
              <div className="tags-form-list">
                {tags.map((t) => (
                  <span key={t} className="tag-pill">
                    #{t}
                    <button
                      type="button"
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTag(t)}
                      aria-label={`Remove tag ${t}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="tag-input-row">
              <input
                type="text"
                placeholder="Add tag (e.g. urgent, call)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                maxLength={20}
                className="tag-input"
              />
              <button
                type="button"
                className="btn btn-secondary tag-add-btn"
                onClick={() => handleAddTag()}
                disabled={!tagInput.trim()}
              >
                + Tag
              </button>
            </div>
            <div className="popular-tags-row">
              <span className="popular-tags-hint">Suggestions:</span>
              {POPULAR_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`suggested-tag-btn ${tags.includes(t) ? "active" : ""}`}
                  onClick={() => (tags.includes(t) ? handleRemoveTag(t) : handleAddTag(t))}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist / Subtasks Section */}
          <div className="form-group checklist-form-group">
            <div className="checklist-form-header">
              <label>Checklist / Subtasks</label>
              {checklist.length > 0 && (
                <span className="checklist-count-badge">
                  {checklist.filter((i) => i.completed).length}/{checklist.length} done
                </span>
              )}
            </div>

            {checklist.length > 0 && (
              <div className="checklist-items-list">
                {checklist.map((item, idx) => (
                  <div key={item.id || idx} className="checklist-form-item">
                    <button
                      type="button"
                      className={`checklist-item-check-btn ${item.completed ? "checklist-check-done" : ""}`}
                      onClick={() => handleToggleChecklistItem(idx)}
                      aria-label={item.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                    >
                      {item.completed && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`checklist-item-text ${item.completed ? "completed-text" : ""}`}>
                      {item.text}
                    </span>
                    <button
                      type="button"
                      className="checklist-item-delete"
                      onClick={() => handleDeleteChecklistItem(idx)}
                      aria-label="Remove checklist item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="checklist-add-row">
              <input
                type="text"
                placeholder="Add a subtask or checklist item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                maxLength={150}
                className="checklist-add-input"
              />
              <button
                type="button"
                className="btn btn-secondary checklist-add-btn"
                onClick={handleAddChecklistItem}
                disabled={!newChecklistText.trim()}
              >
                + Add
              </button>
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || !title.trim()}
            >
              {loading ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

