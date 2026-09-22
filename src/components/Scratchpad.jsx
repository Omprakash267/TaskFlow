import { useState, useEffect, useCallback } from "react";
import {
  subscribeToScratchpad,
  addScratchpadItem,
  toggleScratchpadItem,
  deleteScratchpadItem,
  completeAllScratchpadItems,
  clearCompletedScratchpadItems,
} from "../services/scratchpadService";
import { createTodo } from "../services/todoService";

export default function Scratchpad({ userId }) {
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToScratchpad(userId, (latestItems) => {
      setItems(latestItems);
    });
    return unsubscribe;
  }, [userId]);

  const handleAdd = (e) => {
    e?.preventDefault();
    if (!newText.trim() || !userId) return;
    addScratchpadItem(userId, newText);
    setNewText("");
  };

  const handleToggle = (itemId) => {
    if (!userId) return;
    toggleScratchpadItem(userId, itemId);
  };

  const handleDelete = (itemId) => {
    if (!userId) return;
    deleteScratchpadItem(userId, itemId);
  };

  const handleCompleteAll = () => {
    if (!userId) return;
    completeAllScratchpadItems(userId);
  };

  const handleClearCompleted = () => {
    if (!userId) return;
    clearCompletedScratchpadItems(userId);
  };

  const handleConvertToTask = async (item) => {
    if (!userId) return;
    try {
      await createTodo(userId, {
        title: item.text,
        category: "Personal",
        priority: "Medium",
      });
      deleteScratchpadItem(userId, item.id);
      setFeedback(`Converted "${item.text.substring(0, 20)}..." to Task!`);
      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error("Error converting scratchpad item to task:", err);
    }
  };

  const total = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <section className="scratchpad-card" aria-label="Quick Scratchpad">
      <div
        className="scratchpad-header"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIsOpen((prev) => !prev)}
      >
        <div className="scratchpad-header-left">
          <span className="scratchpad-icon">📝</span>
          <h2 className="scratchpad-title">Scratchpad Checklist</h2>
          {total > 0 && (
            <span className="scratchpad-badge">
              {completedCount}/{total} done ({percent}%)
            </span>
          )}
        </div>
        <button
          type="button"
          className="scratchpad-toggle-btn"
          aria-label={isOpen ? "Collapse scratchpad" : "Expand scratchpad"}
        >
          {isOpen ? "▲ Hide" : "▼ Show"}
        </button>
      </div>

      {isOpen && (
        <div className="scratchpad-body">
          {total > 0 && (
            <div className="scratchpad-progress-bar">
              <div
                className="scratchpad-progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {feedback && (
            <div className="scratchpad-feedback" role="status">
              ✅ {feedback}
            </div>
          )}

          <form onSubmit={handleAdd} className="scratchpad-add-form">
            <input
              type="text"
              placeholder="Quick checklist item or thought..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="scratchpad-input"
              maxLength={150}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm scratchpad-add-btn"
              disabled={!newText.trim()}
            >
              + Add
            </button>
          </form>

          {total === 0 ? (
            <p className="scratchpad-empty">
              No scratchpad items yet. Type a quick idea or checklist above!
            </p>
          ) : (
            <>
              <div className="scratchpad-list">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`scratchpad-item ${item.completed ? "scratchpad-item-done" : ""}`}
                  >
                    <button
                      type="button"
                      className={`scratchpad-check-btn ${item.completed ? "checked" : ""}`}
                      onClick={() => handleToggle(item.id)}
                      aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {item.completed && (
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <span
                      className={`scratchpad-item-text ${item.completed ? "completed-text" : ""}`}
                      onClick={() => handleToggle(item.id)}
                    >
                      {item.text}
                    </span>

                    <div className="scratchpad-item-actions">
                      <button
                        type="button"
                        className="scratchpad-action-btn"
                        onClick={() => handleConvertToTask(item)}
                        title="Convert to formal Task"
                        aria-label={`Convert "${item.text}" to task`}
                      >
                        ↗ Task
                      </button>
                      <button
                        type="button"
                        className="scratchpad-action-btn scratchpad-delete-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Delete item"
                        aria-label={`Delete "${item.text}"`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="scratchpad-footer">
                {completedCount < total && (
                  <button
                    type="button"
                    className="scratchpad-footer-link"
                    onClick={handleCompleteAll}
                  >
                    ✓ Complete all
                  </button>
                )}
                {completedCount > 0 && (
                  <button
                    type="button"
                    className="scratchpad-footer-link"
                    onClick={handleClearCompleted}
                  >
                    🗑️ Clear completed ({completedCount})
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
