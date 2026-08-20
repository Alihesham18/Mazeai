export const THEME_STORAGE_KEY = "synergymazeai-theme";

export const themes = ["dark", "light"] as const;
export type Theme = (typeof themes)[number];

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themes.includes(value as Theme);
}

export const THEME_INIT_SCRIPT = `(() => {
  try {
    const savedTheme = localStorage.getItem("${THEME_STORAGE_KEY}");
    const theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();`;
