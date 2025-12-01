export function applyTheme(theme) {
  const root = document.documentElement;
  let appliedTheme = theme;

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
    appliedTheme = prefersDark ? "dark" : "light";
  } else {
    root.classList.toggle("dark", theme === "dark");
    appliedTheme = theme;
  }

  localStorage.setItem("theme", theme);
  return appliedTheme;
}

// Helper function to get current theme
export function getCurrentTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    if (savedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return savedTheme;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}