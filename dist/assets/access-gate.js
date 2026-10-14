(() => {
  "use strict";

  const expectedDigest = "5845f843d819ea8b53d3b7667c71436110fbc880f74d6280137ab7ce99c838fc";
  const sessionKey = "narra-review-access-v4";

  const unlock = () => {
    document.documentElement.classList.remove("site-locked");
    const gate = document.querySelector(".access-gate");
    if (gate) gate.setAttribute("aria-hidden", "true");
  };

  if (sessionStorage.getItem(sessionKey) === expectedDigest) {
    unlock();
    return;
  }

  window.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("access-form");
    const password = document.getElementById("access-password");
    const visibility = document.getElementById("access-visibility");
    const error = document.getElementById("access-error");

    visibility.addEventListener("click", () => {
      const showing = password.type === "text";
      password.type = showing ? "password" : "text";
      visibility.textContent = showing ? "Show" : "Hide";
      visibility.setAttribute("aria-pressed", String(!showing));
      password.focus();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";

      const bytes = new TextEncoder().encode(password.value);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const digestHex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

      if (digestHex === expectedDigest) {
        sessionStorage.setItem(sessionKey, expectedDigest);
        form.classList.add("is-unlocking");
        window.setTimeout(unlock, 220);
        return;
      }

      password.value = "";
      password.focus();
      form.classList.remove("is-shaking");
      void form.offsetWidth;
      form.classList.add("is-shaking");
      error.textContent = "Incorrect password. Please try again.";
    });
  });
})();
