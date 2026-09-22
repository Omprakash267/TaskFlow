import { useEffect, useState, useMemo } from "react";
import { subscribeToTodos } from "../services/todoService";
import { filterTasks, sortTasks, searchTasks, isOverdue, calculateStreak } from "../utils/helpers";

/**
 * Custom hook that manages user todo state with local reactive subscription,
 * plus search, filter, sort, tags, streak tracking, and live statistics.
 */
export default function useTodos(userId) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("createdAt_desc");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  useEffect(() => {
    if (!userId) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToTodos(userId, (data) => {
      setTodos(data || []);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Extract all unique tags present across tasks
  const availableTags = useMemo(() => {
    const set = new Set();
    todos.forEach((t) => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          if (tag) set.add(tag);
        });
      }
    });
    return Array.from(set).sort();
  }, [todos]);

  // Apply tag → search → filter → sort pipeline with memoization
  const filteredTodos = useMemo(() => {
    let result = todos;
    if (selectedTag) {
      result = result.filter((t) => Array.isArray(t.tags) && t.tags.includes(selectedTag));
    }
    result = searchTasks(result, search);
    result = filterTasks(result, filter);
    result = sortTasks(result, sort);
    return result;
  }, [todos, selectedTag, search, filter, sort]);

  // Computed statistics
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = todos.filter((t) => !t.completed).length;
    const overdue = todos.filter((t) => isOverdue(t)).length;
    const pinned = todos.filter((t) => t.isPinned && !t.completed).length;

    return {
      total,
      completed,
      pending,
      overdue,
      pinned,
    };
  }, [todos]);

  // Computed user productivity streak
  const streakInfo = useMemo(() => {
    return calculateStreak(todos);
  }, [todos]);

  return {
    todos,
    filteredTodos,
    loading,
    error,
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
    streakInfo,
  };
}

