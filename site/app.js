"use strict";
const select = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function monitorImage(image) {
  function update() {
    image.toggleAttribute("data-failed", image.complete && !image.naturalWidth);
  }
  image.addEventListener("error", update);
  image.addEventListener("load", update);
  update();
}
document.querySelectorAll("img[data-optional-media]").forEach(monitorImage);

const briefButton = select("#open-brief");
if (briefButton) {
  const dialog = select("#brief-dialog");
  const template = select("#brief-text");
  const status = select("#brief-status");
  briefButton.hidden = false;
  briefButton.addEventListener("click", () => {
    status.textContent = "";
    dialog.showModal();
  });
  dialog.addEventListener("close", () => briefButton.focus());
  select("#copy-brief").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(template.value);
      status.textContent = "Brief copied.";
    } catch {
      template.focus();
      template.select();
      status.textContent = "Brief selected. Use your device’s copy command.";
    }
  });
}

const inspectionButtons = Array.from(document.querySelectorAll("[data-view]"));
if (inspectionButtons.length) {
  const views = {
    surface: {
      label: "Surface · Color and wear across the lot",
      alt: "Top view of terracotta tiles with worn edges and a range of red and ochre tones",
    },
    edge: {
      label: "Edge · Small chips and an 18–22 mm profile",
      alt: "Close-up of a rough terracotta edge showing thickness and small chips",
    },
    scale: {
      label: "Installed scale · 200 × 200 mm tiles in a courtyard",
      alt: "Terracotta tiles laid in a courtyard, with steps and surrounding walls for scale",
    },
  };
  const frame = select("#lot-image");
  const caption = select("#view-caption");
  const index = select("#view-index");
  const assetFolder = new URL(".", frame.querySelector("img").src);
  const photographs = new Map();
  let selected = "surface";
  let currentPhoto = frame.querySelector("img");
  let transition;

  function getPhoto(key) {
    if (!photographs.has(key)) {
      const image = new Image(1440, 960);
      image.alt = views[key].alt;
      image.src = new URL(key + ".webp", assetFolder);
      monitorImage(image);
      photographs.set(key, image);
    }
    return photographs.get(key);
  }
  photographs.set("surface", currentPhoto);
  inspectionButtons.forEach((button, position) => {
    const key = button.dataset.view;
    button.addEventListener("pointerenter", () => getPhoto(key), {once: true});
    button.addEventListener("focus", () => getPhoto(key), {once: true});
    button.addEventListener("click", () => {
      if (selected === key) return;
      selected = key;
      inspectionButtons.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
      caption.textContent = views[key].label;
      index.textContent = "0" + (position + 1) + " / 03";
      transition?.cancel();
      const photo = getPhoto(key);
      currentPhoto.replaceWith(photo);
      currentPhoto = photo;
      if (!reducedMotion.matches) {
        transition = photo.animate([{opacity: 0.58}, {opacity: 1}], {duration: 220, easing: "ease-out"});
      }
    });
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) transition?.cancel();
  });

  const dialog = select("#hold-dialog");
  const reserve = select("#open-hold");
  const amount = select("#hold-amount");
  reserve.addEventListener("click", () => {
    dialog.showModal();
    amount.focus();
  });
  dialog.addEventListener("close", () => reserve.focus());
  select("#hold-form").addEventListener("submit", (event) => {
    event.preventDefault();
    select("#hold-status").textContent = "Demo reservation previewed for " + amount.valueAsNumber + " m².";
    dialog.close();
  });
}

const departures = Array.from(document.querySelectorAll('input[name="sailing"]'));
if (departures.length) {
  const sailings = {
    early: {departure: "23:10", arrival: "23:24"},
    late: {departure: "23:21", arrival: "23:35"},
  };
  const toMinutes = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  };
  const walk = 8;
  const onward = toMinutes("23:40");
  const save = select("#save-trip");
  const status = select("#save-status");
  const storageKey = "night-ferry-departure";
  let saved = "";
  try {
    const stored = localStorage.getItem(storageKey);
    if (Object.hasOwn(sailings, stored)) saved = stored;
  } catch {}
  if (saved) departures.find((choice) => choice.value === saved).checked = true;

  function render() {
    const choice = departures.find((option) => option.checked).value;
    const sailing = sailings[choice];
    const windowMinutes = onward - toMinutes(sailing.arrival);
    const buffer = windowMinutes - walk;
    const tight = buffer < 0;
    select("#transfer").dataset.state = tight ? "tight" : "good";
    select("#transfer-value").textContent = windowMinutes;
    select("#transfer-label").textContent = tight ? "Too tight" : "Room to transfer";
    select("#transfer-detail").textContent = tight
      ? "The walk takes " + walk + " min. Choose 23:10 for more time."
      : "Allow " + walk + " min between piers. That leaves an " + buffer + " min buffer.";
    select("#depart-time").textContent = sailing.departure;
    select("#arrive-time").textContent = sailing.arrival;
    const isSaved = choice === saved;
    save.textContent = isSaved ? "Remove saved trip" : "Save trip";
    save.setAttribute("aria-pressed", String(isSaved));
  }
  departures.forEach((choice) => choice.addEventListener("change", render));
  save.addEventListener("click", () => {
    const choice = departures.find((option) => option.checked).value;
    const next = saved === choice ? "" : choice;
    try {
      if (next) localStorage.setItem(storageKey, next);
      else localStorage.removeItem(storageKey);
      saved = next;
      status.textContent = saved ? "Trip saved on this device." : "Saved trip removed.";
      render();
    } catch {
      status.textContent = "Saving is unavailable in this browser session.";
    }
  });
  render();
}
