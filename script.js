/**
 * script.js
 * App entry point. Ties astronomy.js (math), moon.js (3D view),
 * calendar.js (timeline UI) and settings.js (preferences) together.
 */

(function () {
  "use strict";

  let selectedDate = startOfDay(new Date());
  let liveMode = true;
  let liveTimer = null;

  const els = {
    moonCanvas: document.getElementById("moon-canvas"),
    phaseEmoji: document.getElementById("phase-emoji"),
    phaseName: document.getElementById("phase-name"),
    statIllumination: document.getElementById("stat-illumination"),
    statAge: document.getElementById("stat-age"),
    statTrend: document.getElementById("stat-trend"),
    liveClock: document.getElementById("live-clock"),
    dateInput: document.getElementById("date-input"),
    selectedDateLabel: document.getElementById("selected-date-label"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    btnToday: document.getElementById("btn-today"),
    upcomingGrid: document.getElementById("upcoming-grid"),
    timelineStrip: document.getElementById("timeline-strip"),
    settingsPanel: document.getElementById("settings-panel"),
    settingsToggle: document.getElementById("settings-toggle"),
  };

  function startOfDay(d) {
    const copy = new Date(d);
    copy.setHours(12, 0, 0, 0); // noon local time avoids DST edge cases when diffing by day
    return copy;
  }

  function dateToInputValue(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function setDate(newDate, { fromLive = false } = {}) {
    selectedDate = startOfDay(newDate);

    // manual navigation drops out of live mode so the user's chosen
    // date doesn't get overwritten by the next live tick
    if (!fromLive && liveMode) {
      liveMode = false;
      const liveToggle = els.settingsPanel.querySelector("#setting-livemode");
      if (liveToggle) liveToggle.checked = false;
      Settings.save({ ...Settings.load(), liveMode: false });
    }

    render();
  }

  function render() {
    const info = Astronomy.getPhaseInfo(selectedDate);

    els.phaseEmoji.textContent = info.emoji;
    els.phaseName.textContent = info.phaseName;
    els.statIllumination.textContent = `${info.illuminationPct}%`;
    els.statAge.textContent = `${info.age.toFixed(1)} days`;
    els.statTrend.textContent = info.waxing ? "Waxing ↑" : "Waning ↓";

    els.dateInput.value = dateToInputValue(selectedDate);
    els.selectedDateLabel.textContent = Calendar.formatLong(selectedDate);

    MoonScene.setPhase(info.fraction);

    Calendar.renderUpcoming(els.upcomingGrid, selectedDate, (d) =>
      setDate(d)
    );
    Calendar.renderStrip(els.timelineStrip, selectedDate, selectedDate, (d) =>
      setDate(d)
    );
  }

  function shiftDay(delta) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setDate(next);
  }

  function goToToday() {
    liveMode = true;
    const liveToggle = els.settingsPanel.querySelector("#setting-livemode");
    if (liveToggle) liveToggle.checked = true;
    Settings.save({ ...Settings.load(), liveMode: true });
    setDate(new Date(), { fromLive: true });
    startLiveTimer();
  }

  function startLiveTimer() {
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(() => {
      if (liveMode) setDate(new Date(), { fromLive: true });
    }, 60 * 1000); // refresh every minute — phase changes far too slowly to need faster
  }

  function stopLiveTimer() {
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = null;
  }

  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    els.liveClock.textContent = `🕒 ${hh}:${mm}:${ss}`;
  }

  function wireControls() {
    els.btnPrev.addEventListener("click", () => shiftDay(-1));
    els.btnNext.addEventListener("click", () => shiftDay(1));
    els.btnToday.addEventListener("click", goToToday);

    els.dateInput.addEventListener("change", () => {
      if (!els.dateInput.value) return;
      const [y, m, d] = els.dateInput.value.split("-").map(Number);
      setDate(new Date(y, m - 1, d));
    });

    document.addEventListener("keydown", (e) => {
      if (e.target === els.dateInput) return;
      if (e.key === "ArrowLeft") shiftDay(-1);
      if (e.key === "ArrowRight") shiftDay(1);
    });
  }

  function init() {
    // Prefer the embedded base64 texture (works from file:// with no CORS
    // issues); fall back to the asset file if that constant isn't present.
    const textureSource =
      typeof MOON_TEXTURE_URL !== "undefined" ? MOON_TEXTURE_URL : "assets/moon.jpg";
    MoonScene.init(els.moonCanvas, textureSource);

    const settings = Settings.init(els.settingsPanel, els.settingsToggle, {
      onAutoRotate: (val) => MoonScene.setAutoRotate(val),
      onLiveMode: (val) => {
        liveMode = val;
        if (val) {
          setDate(new Date(), { fromLive: true });
          startLiveTimer();
        } else {
          stopLiveTimer();
        }
      },
    });

    liveMode = settings.liveMode;
    MoonScene.setAutoRotate(settings.autoRotate);

    wireControls();
    render();
    tickClock();
    setInterval(tickClock, 1000); // real wall-clock time, ticks regardless of live/browse mode

    if (liveMode) startLiveTimer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();