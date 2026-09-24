/**
 * settings.js
 * Small settings panel: toggle auto-rotate, toggle live "now" mode,
 * and persist preferences to localStorage (this runs as a normal local
 * web page, not a sandboxed preview, so localStorage is safe to use).
 */

const Settings = (() => {
  const STORAGE_KEY = "mooncycle.settings.v1";

  const defaults = {
    autoRotate: true,
    liveMode: true,
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      return { ...defaults };
    }
  }

  function save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      /* storage unavailable — settings simply won't persist */
    }
  }

  /**
   * Wires the settings panel UI. `callbacks` = { onAutoRotate(bool), onLiveMode(bool) }
   */
  function init(panelEl, toggleBtnEl, callbacks) {
    const settings = load();

    const autoRotateInput = panelEl.querySelector("#setting-autorotate");
    const liveModeInput = panelEl.querySelector("#setting-livemode");

    autoRotateInput.checked = settings.autoRotate;
    liveModeInput.checked = settings.liveMode;

    autoRotateInput.addEventListener("change", () => {
      settings.autoRotate = autoRotateInput.checked;
      save(settings);
      callbacks.onAutoRotate(settings.autoRotate);
    });

    liveModeInput.addEventListener("change", () => {
      settings.liveMode = liveModeInput.checked;
      save(settings);
      callbacks.onLiveMode(settings.liveMode);
    });

    toggleBtnEl.addEventListener("click", () => {
      panelEl.classList.toggle("is-open");
      toggleBtnEl.setAttribute(
        "aria-expanded",
        panelEl.classList.contains("is-open") ? "true" : "false"
      );
    });

    document.addEventListener("click", (e) => {
      if (
        panelEl.classList.contains("is-open") &&
        !panelEl.contains(e.target) &&
        !toggleBtnEl.contains(e.target)
      ) {
        panelEl.classList.remove("is-open");
        toggleBtnEl.setAttribute("aria-expanded", "false");
      }
    });

    return settings;
  }

  return { load, save, init };
})();