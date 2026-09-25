/**
 * Resolves the theme (stored choice, else the OS preference) and sets it on <html>
 * before first paint, so there is no light/dark flash. Choice values: light | dark | system.
 */
export const THEME_STORAGE_KEY = "signal-theme";

const script = `(function(){try{
  var c = localStorage.getItem("${THEME_STORAGE_KEY}") || "system";
  var dark = c === "dark" || (c === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
