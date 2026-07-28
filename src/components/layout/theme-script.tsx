export function ThemeScript() {
  const script = `
    (() => {
      const storageKey = "professor-sync-theme";
      const root = document.documentElement;
      const savedTheme = window.localStorage.getItem(storageKey);
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = savedTheme ?? (systemPrefersDark ? "dark" : "light");
      root.dataset.theme = theme;
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
