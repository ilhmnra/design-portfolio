"use strict";

const hero = document.querySelector(".premise h1");
const stage = document.querySelector(".waterfront");
const comparison = document.querySelector(".comparison");

if (hero && stage && comparison) {
  const allow = matchMedia("(prefers-reduced-motion: no-preference) and (min-width: 700px)");
  const root = document.documentElement;
  const unit = value => Math.max(0, Math.min(1, value));
  let scheduled = false;

  function paint() {
    scheduled = false;
    root.classList.toggle("enhanced", allow.matches);
    if (!allow.matches) return;
    const viewport = innerHeight;
    const mediaProgress = unit((viewport * .8 - stage.getBoundingClientRect().top) / (viewport * .65));
    const chartProgress = unit((viewport * .94 - comparison.getBoundingClientRect().top) / (viewport * .37));
    root.style.setProperty("--expand", (mediaProgress * mediaProgress * (3 - 2 * mediaProgress)).toFixed(4));
    comparison.style.setProperty("--proof", Math.max(.18, chartProgress).toFixed(4));
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(paint);
  }

  if (allow.matches && scrollY < 40) {
    const text = [...hero.querySelectorAll("span")];
    text.forEach((line, i) => line.animate(
      [{color:"#62645c", transform:"translateY(8px)"}, {color:"#252724", transform:"translateY(0)"}],
      {duration:840, delay:i*115, easing:"cubic-bezier(.2,.65,.3,1)", fill:"backwards"}
    ));
  }

  addEventListener("scroll", schedule, {passive:true});
  addEventListener("resize", schedule, {passive:true});
  allow.addEventListener("change", () => {
    if (!allow.matches) hero.querySelectorAll("span").forEach(line => line.getAnimations().forEach(animation => animation.cancel()));
    schedule();
  });
  document.fonts.ready.then(schedule);
  schedule();
}
