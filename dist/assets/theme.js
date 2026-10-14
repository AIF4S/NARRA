// Loaded in <head> (not deferred) so a saved theme applies before first paint.
// No saved choice: follow the system setting. Storage can be blocked, hence try/catch.
try {
  const saved = localStorage.getItem("narra-theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
} catch {}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".theme-toggle")) return;
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  root.dataset.theme = current === "dark" ? "light" : "dark";
  try { localStorage.setItem("narra-theme", root.dataset.theme); } catch {}
});
