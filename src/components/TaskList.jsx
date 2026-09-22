import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";

export default function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onPin,
  onToggleChecklistItem,
  emptyTitle = "No tasks found",
  emptySubtitle = "Tap the + button to add a new task",
  emptyIcon = "📋",
  onEmptyAction = null,
  emptyActionLabel = "",
}) {
  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        subtitle={emptySubtitle}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="task-list" role="list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
          onToggleChecklistItem={onToggleChecklistItem}
        />
      ))}
    </div>
  );
}

