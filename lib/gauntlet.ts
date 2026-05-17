const KEY = 'checkmate_gauntlet';

export interface GauntletState {
  beatenIds: string[];
  active: boolean;
  currentBotId: string | null;
}

// Ordered from weakest to strongest by ELO
export const GAUNTLET_ORDER: string[] = [
  'chicky',      // 350
  'grandma',     // 420
  'jester',      // 480
  'lucky',       // 510
  'detective',   // 1050
  'gordon',      // 1120
  'jobs',        // 1140
  'bookworm',    // 1160
  'coach',       // 1190
  'bezos',       // 1210
  'arman',       // 1250
  'elon',        // 1280
  'brucelee',    // 1890 (hard tier start — keeping original order)
  'buffett',     // 1760
  'napoleon',    // 1820
  'cleopatra',   // 1870
  'oracle',      // 1910
  'genghis',     // 1940
  'suntzu',      // 1960
  'magnus',      // 2050
  'einstein',    // 2080
  'deepcheck',   // 2200
];

const DEFAULT_STATE: GauntletState = {
  beatenIds: [],
  active: false,
  currentBotId: null,
};

export function getGauntletState(): GauntletState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return JSON.parse(raw) as GauntletState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveGauntletState(state: GauntletState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function startGauntlet(): void {
  const state: GauntletState = {
    beatenIds: [],
    active: true,
    currentBotId: GAUNTLET_ORDER[0],
  };
  saveGauntletState(state);
}

export function markGauntletWin(botId: string): void {
  const state = getGauntletState();
  if (!state.active) return;

  // Only mark if it's the current expected bot
  if (state.currentBotId !== botId) return;

  const newBeaten = [...state.beatenIds, botId];
  const currentIndex = GAUNTLET_ORDER.indexOf(botId);
  const nextBotId = currentIndex < GAUNTLET_ORDER.length - 1
    ? GAUNTLET_ORDER[currentIndex + 1]
    : null;

  saveGauntletState({
    beatenIds: newBeaten,
    active: nextBotId !== null, // deactivate if all beaten
    currentBotId: nextBotId,
  });
}

export function resetGauntlet(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function isGauntletComplete(): boolean {
  const state = getGauntletState();
  return state.beatenIds.length >= GAUNTLET_ORDER.length;
}
