import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "system";
    } catch {
      return "system";
    }
  });

  // Resolve actual visual theme ("light" | "dark") from user setting
  const getResolvedTheme = useCallback((themeSetting) => {
    if (themeSetting === "system") {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    }
    return themeSetting;
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(theme));

  // Apply theme to document element and persist in storage
  useEffect(() => {
    const resolved = getResolvedTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      localStorage.setItem("theme", theme);
    } catch (err) {
      console.warn("Could not save theme preference:", err);
    }
  }, [theme, getResolvedTheme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const resolved = e.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [theme]);

  const setThemeMode = useCallback((mode) => {
    setTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const darkMode = resolvedTheme === "dark";

  const contextValue = useMemo(
    () => ({
      theme,
      darkMode,
      resolvedTheme,
      setThemeMode,
      toggleTheme,
    }),
    [theme, darkMode, resolvedTheme, setThemeMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}