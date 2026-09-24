/**
 * astronomy.js
 * Moon phase, age and illumination calculations.
 * Uses a synodic-month approximation anchored to a known new moon epoch.
 * Accurate to within roughly an hour or two of the phase angle — plenty
 * for a visual/educational tool, not a substitute for ephemeris data.
 */

const Astronomy = (() => {
  const SYNODIC_MONTH = 29.530588853; // mean length of a lunar cycle, in days
  // A known new moon: 6 Jan 2000, 18:14 UTC
  const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);
  const DAY_MS = 86400000;

  const PHASES = [
    { max: 0.033, name: "New Moon", emoji: "🌑" },
    { max: 0.24, name: "Waxing Crescent", emoji: "🌒" },
    { max: 0.26, name: "First Quarter", emoji: "🌓" },
    { max: 0.47, name: "Waxing Gibbous", emoji: "🌔" },
    { max: 0.53, name: "Full Moon", emoji: "🌕" },
    { max: 0.74, name: "Waning Gibbous", emoji: "🌖" },
    { max: 0.76, name: "Last Quarter", emoji: "🌗" },
    { max: 0.967, name: "Waning Crescent", emoji: "🌘" },
    { max: 1.001, name: "New Moon", emoji: "🌑" },
  ];

  /** Fraction of the synodic month elapsed, 0–1 (0 and 1 are both new moon). */
  function getPhaseFraction(date) {
    const diffDays = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS;
    let frac = (diffDays % SYNODIC_MONTH) / SYNODIC_MONTH;
    if (frac < 0) frac += 1;
    return frac;
  }

  /** Age in days since the most recent new moon. */
  function getAge(date) {
    return getPhaseFraction(date) * SYNODIC_MONTH;
  }

  /** Fraction of the visible disc illuminated, 0–1. */
  function getIllumination(phaseFraction) {
    // Illumination follows (1 - cos(2*pi*phase)) / 2
    return (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;
  }

  function getPhaseName(phaseFraction) {
    for (const p of PHASES) {
      if (phaseFraction <= p.max) return { name: p.name, emoji: p.emoji };
    }
    return PHASES[PHASES.length - 1];
  }

  /** True while the illuminated fraction is growing night over night. */
  function isWaxing(phaseFraction) {
    return phaseFraction < 0.5;
  }

  /** Full snapshot for a given date. */
  function getPhaseInfo(date) {
    const frac = getPhaseFraction(date);
    const age = frac * SYNODIC_MONTH;
    const illum = getIllumination(frac);
    const { name, emoji } = getPhaseName(frac);
    return {
      date,
      fraction: frac,
      age,
      illumination: illum,
      illuminationPct: Math.round(illum * 1000) / 10,
      phaseName: name,
      emoji,
      waxing: isWaxing(frac),
    };
  }

  /**
   * Find the next occurrence (on/after `fromDate`) of each of the four
   * primary phases (New, First Quarter, Full, Last Quarter), by walking
   * forward in fractional-day steps and detecting when the phase target
   * is crossed. Returns them sorted by date.
   */
  function getUpcomingPrimaryPhases(fromDate, count = 4) {
    const targets = [
      { frac: 0.0, name: "New Moon", emoji: "🌑" },
      { frac: 0.25, name: "First Quarter", emoji: "🌓" },
      { frac: 0.5, name: "Full Moon", emoji: "🌕" },
      { frac: 0.75, name: "Last Quarter", emoji: "🌗" },
    ];

    const results = [];
    const startMs = fromDate.getTime();

    targets.forEach((t) => {
      const daysSinceEpochPhase = (startMs - KNOWN_NEW_MOON) / DAY_MS;
      const cycles = Math.floor(
        (daysSinceEpochPhase / SYNODIC_MONTH) - t.frac + 1
      );
      let candidateDay =
        KNOWN_NEW_MOON + (cycles + t.frac) * SYNODIC_MONTH * DAY_MS;
      // step forward until candidate is on/after fromDate
      while (candidateDay < startMs - DAY_MS) {
        candidateDay += SYNODIC_MONTH * DAY_MS;
      }
      results.push({
        date: new Date(candidateDay),
        name: t.name,
        emoji: t.emoji,
      });
    });

    results.sort((a, b) => a.date - b.date);
    return results.slice(0, count);
  }

  /** Build an array of {date, ...phaseInfo} for a run of consecutive days. */
  function getDayRange(centerDate, daysBefore, daysAfter) {
    const days = [];
    for (let i = -daysBefore; i <= daysAfter; i++) {
      const d = new Date(centerDate.getTime() + i * DAY_MS);
      days.push({ offset: i, ...getPhaseInfo(d) });
    }
    return days;
  }

  return {
    SYNODIC_MONTH,
    getPhaseFraction,
    getAge,
    getIllumination,
    getPhaseName,
    isWaxing,
    getPhaseInfo,
    getUpcomingPrimaryPhases,
    getDayRange,
  };
})();