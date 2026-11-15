const KEY = 'santa-christmas-adventure-v1';
export const TOTAL_LEVELS = 5;
export const START_LIVES = 3;

export const defaultSettings = {
  music: true,
  sfx: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
};

function defaultSave() {
  return {
    unlockedLevel: 1,
    levels: {},
    run: null, // { level, score, lives } – текущо приключение за бутона „ПРОДЪЛЖИ“
    settings: { ...defaultSettings },
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    const base = defaultSave();
    return {
      ...base,
      ...data,
      levels: data.levels || {},
      settings: { ...base.settings, ...(data.settings || {}) },
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* localStorage може да е недостъпен (private mode) – играта продължава без запис */
  }
  return save;
}

export function saveSettings(settings) {
  const save = loadSave();
  save.settings = { ...save.settings, ...settings };
  return writeSave(save);
}

export function saveRun(run) {
  const save = loadSave();
  save.run = run;
  return writeSave(save);
}

/** Записва резултата от завършено ниво, отключва следващото и обновява текущото приключение. */
export function recordLevelComplete(levelId, stats, run) {
  const save = loadSave();
  const prev = save.levels[levelId] || {};
  save.levels[levelId] = {
    completed: true,
    bestScore: Math.max(prev.bestScore || 0, stats.levelScore),
    stars: Math.max(prev.stars || 0, stats.stars),
    gifts: Math.max(prev.gifts || 0, stats.gifts),
    totalStars: stats.totalStars,
    totalGifts: stats.totalGifts,
    puzzlesSolved: (prev.puzzlesSolved || 0) + 1,
  };
  save.unlockedLevel = Math.min(TOTAL_LEVELS, Math.max(save.unlockedLevel, levelId + 1));
  save.run = run;
  return writeSave(save);
}

export function resetProgress() {
  const save = loadSave();
  const fresh = defaultSave();
  fresh.settings = save.settings;
  return writeSave(fresh);
}

export function aggregateStats(save) {
  let score = 0;
  let stars = 0;
  let gifts = 0;
  let puzzles = 0;
  let completed = 0;
  Object.values(save.levels).forEach((l) => {
    if (l.completed) completed += 1;
    score += l.bestScore || 0;
    stars += l.stars || 0;
    gifts += l.gifts || 0;
    puzzles += l.puzzlesSolved || 0;
  });
  return { score, stars, gifts, puzzles, completed };
}
