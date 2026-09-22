import { FILTERS, SORT_OPTIONS } from "../constants";

export default function FilterBar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  availableTags = [],
  selectedTag = "",
  onTagChange = null,
}) {
  return (
    <div className="filter-bar-container">
      <div className="filter-bar">
        <div className="filter-chips" role="group" aria-label="Filter tasks">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`chip ${filter === f.value ? "chip-active" : ""}`}
              onClick={() => onFilterChange(f.value)}
              aria-pressed={filter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="sort-select-wrapper">
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort tasks"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {availableTags.length > 0 && onTagChange && (
        <div className="filter-tags-row" role="group" aria-label="Filter by tag">
          <span className="filter-tags-label">Tags:</span>
          <button
            type="button"
            className={`filter-tag-chip ${!selectedTag ? "active" : ""}`}
            onClick={() => onTagChange("")}
          >
            All Tags
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`filter-tag-chip ${selectedTag === tag ? "active" : ""}`}
              onClick={() => onTagChange(selectedTag === tag ? "" : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

