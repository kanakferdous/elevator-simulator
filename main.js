/**
 * Elevator Simulator — main.js
 *
 * What this does (high-level):
 * - Builds a elevator scene with a shaft, landing (hall) doors on each floor,
 *   and a car (cabin + doors) that moves between floors.
 * - Renders a compact control panel laid out as:
 *      Row 1: 5, 4, 3
 *      Row 2: 2, 1, [placeholder]
 *      Row 3: G, Open, Close
 *   (G = Ground / floor 0). The placeholder in row 2 keeps all three rows 3-column aligned.
 * - Shows direction indicators (header icons) and an in-cab indicator (SVG only).
 * - Handles door open/close and auto-close dwell.
 * - Moves at a fixed 900ms per floor, updating the current floor as the car passes each level.
 * - UX detail: when a floor button is clicked, that button becomes active immediately
 *   (so the user sees confirmation of their selection before arrival).
 *
 * Key concepts:
 * - CSS variables configure floors and timings; we read them to sync JS with CSS.
 * - `state` holds the car position, direction, moving/doors status, and the currently selected floor.
 * - Movement is time-based: each floor hop waits SPEED_PER_FLOOR (900ms) and increments/decrements `state.current`.
 * - Doors are animated by toggling classes; landing doors on the active floor mirror the car doors.
 */

/* ------------------------- Utilities & Config ------------------------- */

const byId = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Read configuration from CSS custom properties so visuals & logic match
const floors  = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--floors"));
const floorH  = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--floor-h")) || 100;

// Constant travel time per floor (ms). Matches the product constraint: fixed 900ms.
const SPEED_PER_FLOOR = 900;

/* ------------------------------ DOM refs ------------------------------ */

const shaft         = byId("shaft");
const floorsEl      = byId("floors");
const labelsEl      = byId("labels");
const car           = byId("car");
const carIndicator  = byId("carIndicator");

const titleEl       = byId("currentTitle");
const dirUpEl       = byId("dirUp");
const dirDownEl     = byId("dirDown");

const controlsGrid  = byId("controlsGrid");
const openBtn       = byId("openBtn");
const closeBtn      = byId("closeBtn");

/* -------------------------- Indicator SVGs ---------------------------- */

const ICON_SVG_DOWN = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1C14.9174 1 17.7154 2.15878 19.7783 4.22168C21.8412 6.28458 23 9.08262 23 12C23 14.9174 21.8412 17.7154 19.7783 19.7783C17.7154 21.8412 14.9174 23 12 23C9.08262 23 6.28458 21.8412 4.22168 19.7783C2.15878 17.7154 1 14.9174 1 12C1 9.08262 2.15878 6.28458 4.22168 4.22168C6.28458 2.15878 9.08262 1 12 1ZM11.25 5C9.86803 5 8.75 6.11803 8.75 7.5V11H7.04492C5.91638 11.0002 5.00021 11.9164 5 13.0449C5 13.6155 5.23911 14.156 5.65039 14.54V14.541L10.6709 19.2227C11.0287 19.5589 11.5064 19.75 12 19.75C12.5032 19.75 12.9713 19.5526 13.3242 19.2275L13.3291 19.2236L18.3496 14.541V14.54C18.7609 14.156 19 13.6155 19 13.0449C18.9998 11.9164 18.0836 11.0002 16.9551 11H15.25V7.5C15.25 6.11803 14.132 5 12.75 5H11.25Z" stroke="currentColor" stroke-width="2"/></svg>`;
const ICON_SVG_UP   = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 24C15.1826 24 18.2348 22.7357 20.4853 20.4853C22.7357 18.2348 24 15.1826 24 12C24 8.8174 22.7357 5.76516 20.4853 3.51472C18.2348 1.26428 15.1826 0 12 0C8.8174 0 5.76516 1.26428 3.51472 3.51472C1.26428 5.76516 0 8.8174 0 12C0 15.1826 1.26428 18.2348 3.51472 20.4853C5.76516 22.7357 8.8174 24 12 24ZM6.33281 10.1906L11.3531 5.50781C11.5312 5.34375 11.7609 5.25 12 5.25C12.2391 5.25 12.4734 5.34375 12.6469 5.50781L17.6672 10.1906C17.8781 10.3875 18 10.6641 18 10.9547C18 11.5312 17.5312 12 16.9547 12H14.25V16.5C14.25 17.3297 13.5797 18 12.75 18H11.25C10.4203 18 9.75 17.3297 9.75 16.5V12H7.04531C6.46875 12 6 11.5312 6 10.9547C6 10.6641 6.12188 10.3875 6.33281 10.1906Z" fill="currentColor"/></svg>`;

/* ------------------------------- State -------------------------------- */

const state = {
  current: 0,          // current floor index (0 = Ground)
  direction: 0,        // -1 = down, 0 = idle, +1 = up
  moving: false,       // true while traveling
  doors: "closed",     // 'open' | 'closed'
  selected: 0,         // most recently chosen destination (for instant button highlight)
};

let doorTimer = null;
let doorAutoCloseMs = 5000; // dwell time before auto-closing after open

/* ---------------------- Floor naming & scene build --------------------- */

// Returns display names: "Ground Floor", "1st Floor", "2nd Floor", ...
function floorName(f) {
  if (f === 0) return "Ground Floor";
  if (f === 1) return "1st Floor";
  if (f === 2) return "2nd Floor";
  if (f === 3) return "3rd Floor";
  return `${f}th Floor`;
}

// Build floor lines, labels, and landing (hall) doors for each floor
const hallEls = [];
for (let f = 0; f < floors; f++) {
  const y = floorH * f;

  const line = document.createElement("div");
  line.className = "elevator-floor-line";
  line.style.bottom = y + "px";
  floorsEl.appendChild(line);

  const label = document.createElement("div");
  label.className = "elevator-label";
  label.style.bottom = y + 12 + "px";
  label.innerHTML = `<span class="elevator-dot"></span> <span>${floorName(f)}</span>`;
  labelsEl.appendChild(label);

  const hall = document.createElement("div");
  hall.className = "elevator-hall";
  hall.style.bottom = y + "px";
  const left  = document.createElement("div");
  const right = document.createElement("div");
  left.className  = "elevator-hall-panel left";
  right.className = "elevator-hall-panel right";
  hall.append(left, right);
  shaft.appendChild(hall);
  hallEls[f] = { wrap: hall, left, right };
}

// Highlights the active floor label dot
function setActiveLabel(floor) {
  [...labelsEl.children].forEach((el, i) => {
    el.classList.toggle("active", i === floor);
  });
}

// Landing door helpers (mirror car door animation)
function openHallDoors(f) {
  const h = hallEls[f];
  if (!h) return;
  h.wrap.classList.add("closing");
  void h.wrap.offsetWidth;
  h.wrap.classList.add("open");
  h.wrap.classList.remove("closing");
}

function closeHallDoors(f) {
  const h = hallEls[f];
  if (!h) return;
  h.wrap.classList.add("closing");
  void h.wrap.offsetWidth;
  h.wrap.classList.remove("open");
  setTimeout(
    () => h.wrap.classList.remove("closing"),
    parseInt(getComputedStyle(document.documentElement).getPropertyValue("--door-time"))
  );
}

/* ------------------------- Control panel build ------------------------- */

const floorBtnEls = [];

/**
 * Builds the 3 control rows:
 *  - Row 1: [5, 4, 3]
 *  - Row 2: [2, 1, placeholder]  (placeholder keeps column widths consistent)
 *  - Row 3: [G, Open, Close]
 */
function buildControls() {
  controlsGrid.innerHTML = "";
  const max = floors - 1;

  const row1 = document.createElement("div");
  row1.className = "floor-row-1";
  [max, max - 1, max - 2].forEach((f) => {
    const b = document.createElement("button");
    b.className = "control-btn";
    b.textContent = String(f);
    b.addEventListener("click", () => goToFloor(f));
    row1.appendChild(b);
    floorBtnEls[f] = b;
  });
  controlsGrid.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "floor-row-2";
  [max - 3, max - 4].forEach((f) => {
    const b = document.createElement("button");
    b.className = "control-btn";
    b.textContent = String(f);
    b.addEventListener("click", () => goToFloor(f));
    row2.appendChild(b);
    floorBtnEls[f] = b;
  });
  // third cell spacer to keep 3-column layout
  const spacer = document.createElement("button");
  spacer.className = "control-btn placeholder";
  spacer.tabIndex = -1;
  spacer.setAttribute("aria-hidden", "true");
  row2.appendChild(spacer);
  controlsGrid.appendChild(row2);

  const ctrlRow = document.createElement("div");
  ctrlRow.className = "control-row";
  const gBtn = document.createElement("button");
  gBtn.className = "control-btn";
  gBtn.textContent = "G";
  gBtn.addEventListener("click", () => goToFloor(0));
  ctrlRow.appendChild(gBtn);
  floorBtnEls[0] = gBtn;
  ctrlRow.append(openBtn, closeBtn);
  controlsGrid.appendChild(ctrlRow);

  refreshButtons();
}

/**
 * Enables/disables buttons and applies the "active" state.
 * - A floor button is disabled while moving or if it's the current floor.
 * - The "active" highlight follows `state.selected` immediately after click
 *   so users see their destination selection right away.
 */
function refreshButtons() {
  const active = state.selected ?? state.current;
  for (let f = 0; f < floors; f++) {
    const btn = floorBtnEls[f];
    if (!btn) continue;
    const disable = state.moving || f === state.current;
    btn.disabled = disable;
    btn.classList.toggle("active", f === active);
  }
  openBtn.disabled  = state.moving || state.doors === "open";
  closeBtn.disabled = state.moving || state.doors === "closed";
}

/* --------------------------- Motion & doors ---------------------------- */

const carY = (f) => -(floorH * f); // translateY for visual position (negative goes up)

// Auto-close dwell timer helpers
function clearDoorTimer() {
  if (doorTimer) {
    clearTimeout(doorTimer);
    doorTimer = null;
  }
}
function startDoorAutoCloseTimer(ms = doorAutoCloseMs) {
  clearDoorTimer();
  doorTimer = setTimeout(() => {
    if (!state.moving) closeDoors();
  }, ms);
}

// Open/close car + landing doors (current floor)
async function openDoors() {
  if (state.doors === "open") {
    startDoorAutoCloseTimer();
    refreshButtons();
    return;
  }
  openHallDoors(state.current);
  car.classList.add("closing");
  void car.offsetWidth;
  car.classList.add("open");
  car.classList.remove("closing");
  state.doors = "open";
  refreshButtons();
  await sleep(parseInt(getComputedStyle(document.documentElement).getPropertyValue("--door-time")));
  startDoorAutoCloseTimer();
}

async function closeDoors() {
  clearDoorTimer();
  if (state.doors === "closed") {
    refreshButtons();
    return;
  }
  closeHallDoors(state.current);
  car.classList.add("closing");
  void car.offsetWidth;
  car.classList.remove("open");
  state.doors = "closed";
  refreshButtons();
  await sleep(parseInt(getComputedStyle(document.documentElement).getPropertyValue("--door-time")));
  car.classList.remove("closing");
}

/**
 * Core travel routine:
 *  - Immediately highlights the clicked destination (UX).
 *  - Closes doors, sets direction, and animates car to target.
 *  - Ticks floor-by-floor every SPEED_PER_FLOOR to update the display and labels.
 *  - Opens doors on arrival; clears direction and syncs active button with arrived floor.
 */
async function goToFloor(target) {
  state.selected = target;     // instant visual selection
  refreshButtons();

  if (state.moving || target === state.current) return;

  state.direction = target > state.current ? 1 : -1;
  updateHeader();

  await closeDoors();

  const steps = Math.abs(target - state.current);
  if (steps === 0) {
    state.direction = 0;
    updateHeader();
    await openDoors();
    return;
  }

  const duration = steps * SPEED_PER_FLOOR;
  state.moving = true;
  refreshButtons();
  car.style.transition = `transform ${duration}ms linear`;
  car.style.transform  = `translateX(-50%) translateY(${carY(target)}px)`;

  const step = state.direction;
  let temp = state.current;
  for (let i = 0; i < steps; i++) {
    await sleep(SPEED_PER_FLOOR);
    temp += step;
    state.current = temp;
    updateHeader();
  }

  state.moving   = false;
  state.direction = 0;
  state.selected  = state.current; // arrived: keep active on arrived floor
  refreshButtons();
  await openDoors();
}

/* --------------------------- Indicators/UI ---------------------------- */

/**
 * Syncs:
 *  - Title (e.g., "Ground Floor", "3rd Floor")
 *  - Active label dot at the scene's left
 *  - Header direction icons (up/down)
 *  - In-cab indicator (SVG only; no text when idle)
 */
function updateHeader() {
  titleEl.textContent = floorName(state.current);
  setActiveLabel(state.current);

  dirUpEl.classList.toggle("active", state.direction > 0);
  dirDownEl.classList.toggle("active", state.direction < 0);

  carIndicator.className = "elevator-indicator" + (state.direction > 0 ? " up" : state.direction < 0 ? " down" : "");
  if (state.direction > 0)      carIndicator.innerHTML = ICON_SVG_UP;
  else if (state.direction < 0) carIndicator.innerHTML = ICON_SVG_DOWN;
  else                          carIndicator.innerHTML = "";
}

/* ---------------------------- Wire & init ----------------------------- */

openBtn.addEventListener("click", openDoors);
closeBtn.addEventListener("click", closeDoors);

/**
 * Initialization:
 *  - Positions car visually at Ground (0)
 *  - Builds control grid rows
 *  - Renders indicators and button states
 *  - Starts with doors open on Ground
 */
function init() {
  car.style.transform = `translateX(-50%) translateY(${carY(state.current)}px)`;
  buildControls();
  updateHeader();
  refreshButtons();
  openDoors();
}
init();
