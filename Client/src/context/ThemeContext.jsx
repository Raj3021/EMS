import { createContext, useContext, useEffect, useState } from "react";
import { settingsService } from "../services/settingsService";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("system");
  const { user } = useAuth();

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      if (user) {
        try {
          const prefs = await settingsService.getPreferences();
          setTheme(prefs.theme || "system");
        } catch (error) {
          console.error("Failed to load theme preference", error);
        }
      } else {
        // Fallback to local storage or system if not logged in
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
          setTheme(savedTheme);
        }
      }
    };
    loadTheme();
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    // If logged in, we let the Settings page handle the API call, 
    // or we could do it here. For now, we assume Settings page calls API.
    // But to be safe and consistent, the context should probably be the source of truth.
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
