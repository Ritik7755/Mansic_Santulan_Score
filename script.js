/* ==========================================================================
   Student Mental Health Predictor — script.js
   Vanilla JS. No frameworks, no fake predictions — every result on screen
   comes from the FastAPI /predict response.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. API CONFIGURATION
   Change the base URL here — nowhere else in this file references it directly.
   -------------------------------------------------------------------------- */
const API_BASE_URL = "http://127.0.0.1:8000"; // same-origin: if FastAPI serves this file, relative paths avoid CORS

const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;
const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;

/* --------------------------------------------------------------------------
   2. RESPONSE FIELD MAPPING — EDIT THIS IF YOUR BACKEND RESPONSE DIFFERS
   Your FastAPI /predict response is expected to look like:
     { "prediction": 7.42 }
   If your backend uses a different key (e.g. "predicted_score",
   "mental_health_score"), change PREDICTION_RESPONSE_KEY below — nothing
   else needs to change.
   -------------------------------------------------------------------------- */
const PREDICTION_RESPONSE_KEY = "predicted_mental_health_score";

/* --------------------------------------------------------------------------
   3b. SCORE INTERPRETATION — EDIT THESE RANGES/LABELS AS YOU LIKE
   These are the frontend's own descriptive tiers, applied on top of the raw
   number returned by the API — they are NOT clinical categories and are not
   returned by the backend. If your project has documented thresholds,
   replace the ranges/labels/quotes below with those. Otherwise keep the
   wording general (about the input factors, not a diagnosis) so the
   disclaimer under the result stays accurate.
   Ranges assume a 0–10 scale; edit `max` values if your model's scale
   differs.
   -------------------------------------------------------------------------- */
const SCORE_INTERPRETATION = [
  {
    max: 3.9,
    label: "Lower range",
    quote: "Based on the usage, sleep and activity figures entered, this score falls toward the lower end of what the model predicts, which often points to a few areas worth a closer look.",
  },
  {
    max: 5.9,
    label: "Below average",
    quote: "This score lands just below the midpoint of the model's range, suggesting the balance between usage, sleep and activity has some room to improve.",
  },
  {
    max: 7.9,
    label: "Above average",
    quote: "This score lands just above the midpoint of the model's range, suggesting the reported usage, sleep and activity are working reasonably well together.",
  },
  {
    max: Infinity,
    label: "Higher range",
    quote: "Based on the usage, sleep and activity figures entered, this score falls toward the higher end of what the model predicts, which suggests those habits are working well together.",
  },
];

function getScoreInterpretation(score) {
  return SCORE_INTERPRETATION.find((tier) => score <= tier.max) || SCORE_INTERPRETATION[SCORE_INTERPRETATION.length - 1];
}

/* --------------------------------------------------------------------------
   3. REQUEST FIELD MAPPING
   These are the exact keys sent in the JSON body of the POST /predict
   request. They must match your Pydantic model field names exactly.
   Each <input>/<select> below already has name="..." set to match, so
   collectFormData() builds this object automatically from the DOM —
   if your backend expects different field names, just update the
   `name` attribute on the corresponding form control in index.html.
   -------------------------------------------------------------------------- */

/* A representative sample of countries for the datalist. The input still
   accepts any typed value — the backend's own preprocessing is responsible
   for grouping anything outside its top-country list into "Other". */
const COUNTRY_OPTIONS = [
  "United States", "India", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Brazil", "Nigeria", "Pakistan", "Bangladesh",
  "Philippines", "Indonesia", "Mexico", "South Africa", "Japan",
  "South Korea", "China", "Italy", "Spain", "Egypt", "Kenya",
  "Vietnam", "Turkey", "Russia", "Other"
];

/* --------------------------------------------------------------------------
   STATE
   -------------------------------------------------------------------------- */
let isSubmitting = false;

/* --------------------------------------------------------------------------
   INIT
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  populateCountryList();
  initTheme();
  initNav();
  initStressSelector();
  initScrollReveal();
  checkAPIStatus();

  const form = document.getElementById("predictForm");
  form.addEventListener("submit", handleFormSubmit);

  document.getElementById("resetBtn").addEventListener("click", resetForm);

  // Live-validate a field once the user has interacted with it.
  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("blur", () => {
      el.dataset.touched = "true";
      validateField(el);
    });
  });
});

/* --------------------------------------------------------------------------
   COUNTRY DATALIST
   -------------------------------------------------------------------------- */
function populateCountryList() {
  const list = document.getElementById("countryList");
  list.innerHTML = COUNTRY_OPTIONS.map((c) => `<option value="${c}"></option>`).join("");
}

/* --------------------------------------------------------------------------
   THEME TOGGLE (persisted in localStorage)
   -------------------------------------------------------------------------- */
function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const stored = safeGetLocalStorage("mhp-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = stored || (prefersLight ? "light" : "dark");
  applyTheme(theme);

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    safeSetLocalStorage("mhp-theme", next);
  });
}

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const toggle = document.getElementById("themeToggle");
  toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  toggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
}

function safeGetLocalStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function safeSetLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    /* storage unavailable — theme just won't persist */
  }
}

/* --------------------------------------------------------------------------
   NAVIGATION — smooth scroll + mobile menu
   -------------------------------------------------------------------------- */
function initNav() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileNav();
    });
  });

  const hamburger = document.getElementById("hamburgerBtn");
  const nav = document.getElementById("main-nav");
  hamburger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
}

function closeMobileNav() {
  const nav = document.getElementById("main-nav");
  const hamburger = document.getElementById("hamburgerBtn");
  nav.classList.remove("is-open");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.setAttribute("aria-label", "Open menu");
}

/* --------------------------------------------------------------------------
   STRESS LEVEL SEGMENTED CONTROL
   -------------------------------------------------------------------------- */
function initStressSelector() {
  const options = document.querySelectorAll(".stress-option");
  const hiddenInput = document.getElementById("stressLevel");

  options.forEach((btn) => {
    btn.addEventListener("click", () => {
      options.forEach((o) => o.setAttribute("aria-checked", "false"));
      btn.setAttribute("aria-checked", "true");
      hiddenInput.value = btn.dataset.value;
      clearFieldError("stress");
    });
  });
}

/* --------------------------------------------------------------------------
   SCROLL REVEAL (subtle, IntersectionObserver-based)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll(".pipeline-step, .about-card");
  targets.forEach((el) => el.classList.add("reveal"));

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   API STATUS CHECK
   -------------------------------------------------------------------------- */
async function checkAPIStatus() {
  const statusEl = document.getElementById("apiStatus");
  const textEl = document.getElementById("apiStatusText");

  try {
    const response = await fetch(HEALTH_ENDPOINT, { method: "GET" });
    if (response.ok) {
      statusEl.dataset.state = "online";
      textEl.textContent = "API Connected";
    } else {
      // /health exists but didn't return OK — don't assume the whole API is down.
      statusEl.dataset.state = "unknown";
      textEl.textContent = "API Ready";
    }
  } catch (error) {
    // /health may simply not be implemented — that's fine, don't break the app.
    console.error("Health check failed:", error);
    statusEl.dataset.state = "unknown";
    textEl.textContent = "API Ready";
  }
}

/* --------------------------------------------------------------------------
   FORM VALIDATION
   -------------------------------------------------------------------------- */
const FIELD_LABELS = {
  age: "Age",
  gender: "Gender",
  country: "Country",
  academicLevel: "Academic level",
  avgUsage: "Average daily usage hours",
  dailyUnlocks: "Daily unlocks",
  platform: "Most used platform",
  purpose: "Purpose of use",
  studyHours: "Study hours",
  sleepHours: "Sleep hours",
  activityHours: "Physical activity hours",
};

function validateField(el) {
  const id = el.id;
  let message = "";

  if (el.type === "select-one" || el.tagName === "SELECT") {
    if (!el.value) message = `Please select ${lowerFirst(FIELD_LABELS[id] || "a value")}.`;
  } else if (el.type === "number") {
    if (el.value === "") {
      message = `Please enter ${lowerFirst(FIELD_LABELS[id] || "a value")}.`;
    } else if (Number(el.value) < Number(el.min || 0)) {
      message = `${FIELD_LABELS[id] || "This field"} cannot be negative.`;
    } else if (id === "age" && Number(el.value) <= 0) {
      message = "Age must be greater than 0.";
    }
  } else if (el.tagName === "INPUT" && el.required) {
    if (!el.value.trim()) message = `Please enter ${lowerFirst(FIELD_LABELS[id] || "a value")}.`;
  }

  setFieldError(id, message);
  return message === "";
}

function lowerFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function setFieldError(id, message) {
  const errorEl = document.getElementById(`err-${id}`);
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(id) {
  setFieldError(id, "");
}

function validateForm(form) {
  let isValid = true;

  form.querySelectorAll("input[required], select[required]").forEach((el) => {
    el.dataset.touched = "true";
    if (!validateField(el)) isValid = false;
  });

  // Stress level is a custom control, validated separately.
  const stressValue = document.getElementById("stressLevel").value;
  if (!stressValue) {
    setFieldError("stress", "Please select a stress level.");
    isValid = false;
  } else {
    clearFieldError("stress");
  }

  return isValid;
}

/* --------------------------------------------------------------------------
   COLLECT FORM DATA
   Builds the request payload straight from each control's `name` attribute,
   so the JSON keys always match the Pydantic model as long as the `name`
   attributes in index.html match your backend schema.
   -------------------------------------------------------------------------- */
function collectFormData(form) {
  const data = {};

  form.querySelectorAll("[name]").forEach((el) => {
    if (el.type === "number") {
      data[el.name] = el.value === "" ? null : Number(el.value);
    } else {
      data[el.name] = el.value;
    }
  });

  return data;
}

/* --------------------------------------------------------------------------
   FORM SUBMIT HANDLER
   -------------------------------------------------------------------------- */
async function handleFormSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const form = event.target;
  hideApiError();

  if (!validateForm(form)) {
    const firstError = form.querySelector(".field-error:not(:empty)");
    if (firstError) firstError.closest("fieldset, .field")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const payload = collectFormData(form);

  showLoading(true);
  try {
    const result = await sendPrediction(payload);
    displayPrediction(result);
  } catch (error) {
    console.error("Prediction request failed:", error);
    showError(error);
  } finally {
    showLoading(false);
  }
}

/* --------------------------------------------------------------------------
   SEND PREDICTION REQUEST
   -------------------------------------------------------------------------- */
async function sendPrediction(payload) {
  let response;
  try {
    response = await fetch(PREDICT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    // fetch() itself threw — the server is unreachable.
    throw { type: "network", original: networkError };
  }

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch (parseError) {
      /* response wasn't JSON — leave body null */
    }
    throw { type: "http", status: response.status, body };
  }

  return response.json();
}

/* --------------------------------------------------------------------------
   LOADING STATE
   -------------------------------------------------------------------------- */
function showLoading(isLoading) {
  isSubmitting = isLoading;
  const btn = document.getElementById("predictBtn");
  const label = btn.querySelector(".btn-label");

  btn.disabled = isLoading;
  btn.classList.toggle("is-loading", isLoading);
  label.textContent = isLoading ? "Analyzing…" : "Predict mental health score";
}

/* --------------------------------------------------------------------------
   DISPLAY PREDICTION
   -------------------------------------------------------------------------- */
function displayPrediction(result) {
  const rawScore = result ? result[PREDICTION_RESPONSE_KEY] : undefined;

  if (typeof rawScore !== "number" || Number.isNaN(rawScore)) {
    showError({
      type: "shape",
      message: `The server responded, but no numeric "${PREDICTION_RESPONSE_KEY}" field was found. Check PREDICTION_RESPONSE_KEY in script.js against your actual API response.`,
    });
    return;
  }

  const resultCard = document.getElementById("resultCard");
  const noteEl = document.getElementById("resultNote");
  const tagEl = document.getElementById("resultTag");
  const quoteEl = document.getElementById("resultQuote");

  const tier = getScoreInterpretation(Math.max(0, Math.min(10, rawScore)));
  tagEl.textContent = tier.label;
  quoteEl.textContent = tier.quote;

  resultCard.hidden = false;
  noteEl.textContent = "Prediction generated successfully.";
  animateScore(rawScore);
  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* --------------------------------------------------------------------------
   ANIMATE SCORE (number count-up + ring fill)
   Assumes the score sits on a 0–10 scale for the ring visualization only —
   the displayed numeric value is always the exact figure the API returned.
   -------------------------------------------------------------------------- */
function animateScore(score) {
  const numberEl = document.getElementById("resultNumber");
  const ring = document.getElementById("resultRing");
  const circumference = 2 * Math.PI * 68; // r=68, matches the SVG circle

  const clamped = Math.max(0, Math.min(10, score));
  const ratio = clamped / 10;
  const offset = circumference * (1 - ratio);

  // Ring fill transition (CSS handles the easing).
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = String(offset);
  });

  // Count-up animation for the number.
  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = score * eased;
    numberEl.textContent = current.toFixed(2);
    if (progress < 1) requestAnimationFrame(tick);
    else numberEl.textContent = formatScore(score);
  }
  requestAnimationFrame(tick);
}

function formatScore(score) {
  return Number.isInteger(score) ? score.toFixed(1) : String(Math.round(score * 100) / 100);
}

/* --------------------------------------------------------------------------
   ERROR HANDLING
   -------------------------------------------------------------------------- */
function showError(error) {
  const banner = document.getElementById("apiErrorBanner");

  if (error && error.type === "network") {
    banner.innerHTML =
      "<strong>Unable to connect to the prediction server.</strong>" +
      `Make sure FastAPI is running at ${API_BASE_URL || window.location.origin}.`;
  } else if (error && error.type === "http" && error.status === 422) {
    const detail = extractValidationDetail(error.body);
    banner.innerHTML =
      "<strong>Please check your input values.</strong>" + (detail || "The server rejected one or more fields.");
  } else if (error && error.type === "http" && error.status >= 500) {
    banner.innerHTML =
      "<strong>Something went wrong on the server.</strong>Please try again.";
  } else if (error && error.type === "http") {
    banner.innerHTML = `<strong>Request failed (HTTP ${error.status}).</strong>Please check your input and try again.`;
  } else if (error && error.type === "shape") {
    banner.innerHTML = `<strong>Unexpected response format.</strong>${error.message}`;
  } else {
    banner.innerHTML = "<strong>Something went wrong.</strong>Please try again.";
  }

  banner.hidden = false;
  banner.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideApiError() {
  const banner = document.getElementById("apiErrorBanner");
  banner.hidden = true;
  banner.innerHTML = "";
}

function extractValidationDetail(body) {
  if (!body || !Array.isArray(body.detail)) return "";
  const messages = body.detail
    .map((d) => {
      const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "field";
      return `${field}: ${d.msg}`;
    })
    .slice(0, 5);
  return messages.length ? ` (${messages.join("; ")})` : "";
}

/* --------------------------------------------------------------------------
   RESET FORM
   -------------------------------------------------------------------------- */
function resetForm() {
  const form = document.getElementById("predictForm");
  form.reset();

  form.querySelectorAll("[data-touched]").forEach((el) => delete el.dataset.touched);
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));

  document.querySelectorAll(".stress-option").forEach((o) => o.setAttribute("aria-checked", "false"));
  document.getElementById("stressLevel").value = "";
  clearFieldError("stress");

  hideApiError();

  const resultCard = document.getElementById("resultCard");
  resultCard.hidden = true;
  document.getElementById("resultRing").style.strokeDashoffset = "427.3";
  document.getElementById("resultNumber").textContent = "0.0";
  document.getElementById("resultTag").textContent = "";
  document.getElementById("resultQuote").textContent = "";

  showLoading(false);

  document.getElementById("predictor").scrollIntoView({ behavior: "smooth", block: "start" });
}
