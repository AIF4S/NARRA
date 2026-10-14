// Play videos only while on screen; HUD timecode + seekable progress bar.
const fmt = (t) => {
  t = Math.floor(t || 0);
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())),
  { threshold: 0.4 }
);

document.querySelectorAll(".frame").forEach((frame) => {
  const v = frame.querySelector("video");
  const bar = frame.querySelector(".bar");
  const tc = frame.querySelector(".tc");
  const toggle = () => (v.paused ? v.play().catch(() => {}) : v.pause());

  // Every video gets a compact acceleration control without duplicating markup in each card.
  const speedControl = document.createElement("label");
  speedControl.className = "speed-control mono";
  speedControl.innerHTML =
    '<span>Speed</span><input type="range" min="0.5" max="4" step="0.5" value="1" aria-label="Playback speed"><output>1×</output>';
  frame.append(speedControl);
  const speed = speedControl.querySelector("input");
  const speedValue = speedControl.querySelector("output");
  speed.addEventListener("input", () => {
    v.playbackRate = Number(speed.value);
    speedValue.value = Number(speed.value).toFixed(speed.value % 1 ? 1 : 0) + "×";
  });

  frame.dataset.state = "paused";
  if (!reduced) io.observe(v);

  v.addEventListener("play", () => (frame.dataset.state = "playing"));
  v.addEventListener("pause", () => (frame.dataset.state = "paused"));
  v.addEventListener("timeupdate", () => {
    if (!v.duration) return;
    frame.style.setProperty("--p", v.currentTime / v.duration);
    tc.textContent = fmt(v.currentTime) + " / " + fmt(v.duration);
  });
  v.addEventListener("click", toggle);
  v.addEventListener("dblclick", () => v.requestFullscreen?.());
  v.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
  });
  // Click or drag along the bar to seek.
  const seek = (e) => {
    if (!v.duration) return;
    const r = bar.getBoundingClientRect();
    v.currentTime = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * v.duration;
  };
  bar.addEventListener("pointerdown", (e) => {
    bar.setPointerCapture(e.pointerId);
    if (!v.duration) v.play().catch(() => {}); // unloaded video: start it so seeking becomes possible
    seek(e);
  });
  bar.addEventListener("pointermove", (e) => e.buttons && seek(e));
});

// Highlight the section-menu link for the section in view.
const tocLinks = [...document.querySelectorAll(".toc a")];
const sectionIO = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) tocLinks.forEach((a) => a.setAttribute("aria-current", a.hash === "#" + e.target.id));
  }),
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("main section").forEach((s) => sectionIO.observe(s));

// Copy the BibTeX entry.
const copyBib = document.querySelector(".copy-bib");
copyBib?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(document.querySelector("#bibtex code").textContent);
    copyBib.textContent = "Copied";
  } catch {
    copyBib.textContent = "Select and copy";
  }
  setTimeout(() => (copyBib.textContent = "Copy"), 1600);
});
