import { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./themeContext";

const STORAGE_KEY = "hmac-theme";

// index.html sets data-theme before first paint; start from whatever it chose.
const readInitialTheme = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage can be unavailable (private mode); the toggle still works for this visit.
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
