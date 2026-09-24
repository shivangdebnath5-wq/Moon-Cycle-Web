/**
 * calendar.js
 * Builds the date strip (a run of days centered on the selected date)
 * and the "upcoming primary phases" cards. Pure DOM rendering — the
 * math lives in astronomy.js.
 */

const Calendar = (() => {
  const DAY_MS = 86400000;

  function formatShort(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatLong(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function isSameDay(a, b) {
    return (
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate()
    );
  }

  /**
   * Renders a horizontal strip of day cards around `centerDate`.
   * onSelect(date) fires when a card is clicked.
   */
  function renderStrip(el, centerDate, selectedDate, onSelect) {
    const days = Astronomy.getDayRange(centerDate, 6, 14);
    el.innerHTML = "";

    days.forEach((d) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "day-card";
      if (isSameDay(d.date, selectedDate)) card.classList.add("is-selected");
      if (isSameDay(d.date, new Date())) card.classList.add("is-today");

      card.innerHTML = `
        <span class="day-card__emoji">${d.emoji}</span>
        <span class="day-card__date">${formatShort(d.date)}</span>
        <span class="day-card__pct">${d.illuminationPct}%</span>
      `;
      card.addEventListener("click", () => onSelect(new Date(d.date)));
      el.appendChild(card);
    });

    // scroll selected card into view, centered
    requestAnimationFrame(() => {
      const active = el.querySelector(".is-selected");
      if (active) {
        active.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    });
  }

  /** Renders the four upcoming primary-phase cards. */
  function renderUpcoming(el, fromDate, onSelect) {
    const events = Astronomy.getUpcomingPrimaryPhases(fromDate, 4);
    el.innerHTML = "";

    events.forEach((ev) => {
      const daysAway = Math.round((ev.date - fromDate) / DAY_MS);
      const label =
        daysAway <= 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `In ${daysAway} days`;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "phase-card";
      card.innerHTML = `
        <span class="phase-card__emoji">${ev.emoji}</span>
        <span class="phase-card__name">${ev.name}</span>
        <span class="phase-card__date">${formatShort(ev.date)}</span>
        <span class="phase-card__away">${label}</span>
      `;
      card.addEventListener("click", () => onSelect(new Date(ev.date)));
      el.appendChild(card);
    });
  }

  return { formatShort, formatLong, isSameDay, renderStrip, renderUpcoming };
})();