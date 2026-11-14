"use strict";

// Keep the inspection cue continuous between its two resting positions.
// Layout, focus and all readable content stay in their natural sections.
{
  const opening = document.querySelector(".opening-bracket");
  const proof = document.querySelector(".proof-bracket");
  const traveling = document.querySelector(".traveling-bracket");
  const title = document.querySelector("#proof-title");

  if (opening && proof && traveling && title) {
    const playable = window.matchMedia("(min-width: 850px) and (prefers-reduced-motion: no-preference)");
    const root = document.documentElement;
    let pending = false;

    function updateBracket() {
      pending = false;
      const start = opening.getBoundingClientRect();
      const end = proof.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewport * 0.87 - title.getBoundingClientRect().top) / (viewport * 0.50)));
      const active = playable.matches && progress > 0 && progress < 1 && start.width > 0 && end.width > 0;
      root.classList.toggle("sequence-running", active);
      if (!active) return;

      const mix = (a, b) => a + (b - a) * progress;
      const x = mix(start.left, end.left);
      const y = mix(start.top, end.top);
      traveling.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      traveling.style.width = mix(start.width, end.width) + "px";
      traveling.style.height = mix(start.height, end.height) + "px";
      traveling.style.setProperty("--arm", mix(22, 10) + "px");
      traveling.style.color = "rgb(" + mix(255, 251) + "," + mix(242, 209) + "," + mix(216, 167) + ")";
      traveling.style.filter = "drop-shadow(0 1px 1px #301c15e0)";
    }

    function scheduleBracket() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(updateBracket);
    }

    window.addEventListener("scroll", scheduleBracket, {passive: true});
    window.addEventListener("resize", scheduleBracket, {passive: true});
    playable.addEventListener("change", scheduleBracket);
    document.fonts.ready.then(scheduleBracket);
    scheduleBracket();
  }
}
