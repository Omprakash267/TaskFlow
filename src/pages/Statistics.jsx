import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import useTodos from "../hooks/useTodos";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import { CATEGORIES } from "../constants";
import { getDayName, isSameDay } from "../utils/helpers";

export default function Statistics() {
  const { user } = useAuth();
  const { todos, stats, streakInfo, loading } = useTodos(user?.uid);

  const recurringCount = useMemo(
    () => todos.filter((t) => t.recurring && t.recurring !== "none").length,
    [todos]
  );

  const pinnedCount = useMemo(() => todos.filter((t) => t.isPinned).length, [todos]);

  // Weekly completion data (last 7 days, ending today)
  const weeklyData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const completedCount = todos.filter((t) => {
        if (!t.completed) return false;
        const timestamp = t.updatedAt || t.createdAt;
        if (!timestamp) return false;
        const taskDate = new Date(timestamp);
        return isSameDay(taskDate, targetDate);
      }).length;

      days.push({
        label: getDayName(targetDate.getDay()),
        value: completedCount,
        isToday: i === 0,
        fullDate: targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return days;
  }, [todos]);

  const maxWeekly = Math.max(...weeklyData.map((d) => d.value), 1);

  // Category breakdown
  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = todos.filter((t) => t.category === cat.value).length;
      const completed = todos.filter((t) => t.category === cat.value && t.completed).length;
      return {
        ...cat,
        count,
        completed,
        pct: count > 0 ? Math.round((completed / count) * 100) : 0,
      };
    }).filter((c) => c.count > 0);
  }, [todos]);

  // Completion percentage
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) return <Loading message="Loading analytics..." />;

  return (
    <div className="page statistics-page">
      <Header title="Statistics" />

      <div className="stats-grid" role="region" aria-label="Statistics Summary">
        <StatCard label="Total" value={stats.total} color="#6366f1" icon="📋" />
        <StatCard label="Completed" value={stats.completed} color="#22c55e" icon="✅" />
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" icon="⏳" />
        <StatCard label="Overdue" value={stats.overdue} color="#ef4444" icon="🔴" />
      </div>

      {/* Habit & Streak Tracker */}
      <section className="stat-section">
        <h2 className="section-title">Habits & Streaks</h2>
        <div className="habit-stats-grid" role="region" aria-label="Habit and Streak Statistics">
          <div className="habit-stat-card">
            <span className="habit-stat-icon">🔥</span>
            <div className="habit-stat-info">
              <span className="habit-stat-val">{streakInfo.currentStreak} Days</span>
              <span className="habit-stat-lbl">Current Streak</span>
            </div>
          </div>
          <div className="habit-stat-card">
            <span className="habit-stat-icon">🏆</span>
            <div className="habit-stat-info">
              <span className="habit-stat-val">{streakInfo.bestStreak} Days</span>
              <span className="habit-stat-lbl">Best Streak</span>
            </div>
          </div>
          <div className="habit-stat-card">
            <span className="habit-stat-icon">🔁</span>
            <div className="habit-stat-info">
              <span className="habit-stat-val">{recurringCount}</span>
              <span className="habit-stat-lbl">Repeating Habits</span>
            </div>
          </div>
          <div className="habit-stat-card">
            <span className="habit-stat-icon">⭐</span>
            <div className="habit-stat-info">
              <span className="habit-stat-val">{pinnedCount}</span>
              <span className="habit-stat-lbl">Pinned Focus</span>
            </div>
          </div>
        </div>
      </section>

      {/* Completion Progress */}
      <section className="stat-section">
        <h2 className="section-title">Overall Progress</h2>
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-pct">{completionPct}%</span>
            <span className="progress-label">
              {stats.completed} of {stats.total} tasks completed
            </span>
          </div>
          <div
            className="progress-bar-track"
            role="progressbar"
            aria-valuenow={completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Weekly Chart */}
      <section className="stat-section">
        <h2 className="section-title">7-Day Completion Activity</h2>
        <div className="weekly-chart" role="region" aria-label="7-Day Completion Bar Chart">
          {weeklyData.map((day, i) => (
            <div key={i} className="weekly-bar-container" title={`${day.fullDate}: ${day.value} completed`}>
              <span className="weekly-bar-value">{day.value}</span>
              <div className="weekly-bar-track">
                <div
                  className={`weekly-bar-fill ${day.isToday ? "weekly-bar-today" : ""}`}
                  style={{
                    height: `${(day.value / maxWeekly) * 100}%`,
                    minHeight: day.value > 0 ? "8px" : "2px",
                  }}
                />
              </div>
              <span className={`weekly-bar-label ${day.isToday ? "weekly-label-today" : ""}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <section className="stat-section">
          <h2 className="section-title">Tasks by Category</h2>
          <div className="category-list">
            {categoryStats.map((cat) => (
              <div key={cat.value} className="category-stat-row">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "4px" }}>
                  <span className="category-stat-label">{cat.label}</span>
                  <span className="category-stat-count" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {cat.completed}/{cat.count} done ({cat.pct}%)
                  </span>
                </div>
                <div className="category-stat-bar-track">
                  <div
                    className="category-stat-bar-fill"
                    style={{
                      width: `${stats.total > 0 ? (cat.count / stats.total) * 100 : 0}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {todos.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">No data yet</h3>
          <p className="empty-state-subtitle">Start adding and completing tasks to see your statistics</p>
        </div>
      )}
    </div>
  );
}

