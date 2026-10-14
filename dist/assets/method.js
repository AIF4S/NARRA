// Method section: the diagram in <template id="mw-diagram"> is cloned into each part, cropped to that part (data-view),
// and its step animation starts when the part scrolls into view.
// Block scope keeps these names separate from site.js globals.
{
  const source = document.getElementById("mw-diagram").innerHTML.trim();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Two fast ticks per slow update, then the slow weights move and the fast weights reset.
  const counters = (svg, run) => {
    clearInterval(svg._timer);
    const slowText = svg.querySelector(".slow-count");
    const fastText = svg.querySelector(".fast-count");
    let slow = 40, fast = 2;
    const paint = () => {
      slowText.textContent = `slow ${slow}/40`;
      fastText.textContent = `fast ${fast}/2`;
    };
    paint();
    if (!run || reduced) return;
    slow = 0, fast = 0;
    svg._timer = setInterval(() => {
      if (fast < 2) fast++;
      else { fast = 0; slow = slow >= 40 ? 1 : slow + 1; }
      paint();
    }, 220);
  };

  const parts = [...document.querySelectorAll(".mw-crop")].map((slot) => {
    const n = slot.closest(".mw-part").dataset.step;
    // Suffix every id (markers, clip paths, motion paths) so clones never collide with each other.
    slot.innerHTML = source
      .replace(/id="([^"]+)"/g, `id="$1-${n}"`)
      .replace(/url\(#([^)]+)\)/g, `url(#$1-${n})`)
      .replace(/href="#([^"]+)"/g, `href="#$1-${n}"`);
    const svg = slot.firstElementChild;
    svg.setAttribute("viewBox", slot.dataset.view);
    // Same drawing scale for every part: the card's width follows the cropped region's width.
    slot.style.setProperty("--w", slot.dataset.view.split(" ")[2]);
    svg.setAttribute("aria-label", slot.getAttribute("aria-label"));
    svg.dataset.n = n;
    svg.dataset.step = "pre";
    svg.querySelectorAll(".g").forEach((g) => g.classList.toggle("on", g.dataset.on.split(" ").includes(n)));
    if (reduced) svg.pauseAnimations();
    return svg;
  });

  // Entering view restarts the part's animation; leaving resets it so it replays next time.
  const io = new IntersectionObserver(
    (entries) => entries.forEach(({ target: svg, isIntersecting }) => {
      svg.dataset.step = isIntersecting ? svg.dataset.n : "pre";
      counters(svg, isIntersecting && svg.dataset.n === "4");
    }),
    { threshold: 0.4 }
  );
  parts.forEach((svg) => io.observe(svg));
}
