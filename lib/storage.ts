import type { GameRecord, PlayerStats } from './game-logic';
import { syncPlayerStats, addGameRecord } from './supabase';
import type { GameExtras } from './challenges';
import { checkAndUpdateChallenges } from './challenges';

const STORAGE_KEYS = {
  USERNAME: 'checkmate_arena_username',
  CITY: 'checkmate_arena_city',
  STATS: 'checkmate_arena_stats',
  HISTORY: 'checkmate_arena_history',
  LEADERBOARD: 'checkmate_arena_leaderboard',
  THEME: 'checkmate_arena_theme',
  PRO: 'checkmate_arena_pro',
  COINS: 'checkmate_arena_coins',
  STREAK: 'checkmate_arena_streak',
};

export function getUsername(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.USERNAME) || '';
}

export function getCity(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.CITY) || '';
}

export function setCity(city: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CITY, city);
}

export function setUsername(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERNAME, name);
  // Update leaderboard entry
  const lb = getLeaderboard();
  const existing = lb.find(p => p.username === name);
  if (!existing) {
    lb.push({ username: name, wins: 0, losses: 0, draws: 0, gamesPlayed: 0, city: getCity(), elo: 1200 });
    saveLeaderboard(lb);
  }
}

export function getStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return { username: '', wins: 0, losses: 0, draws: 0, gamesPlayed: 0, elo: 1200 };
  }
  const raw = localStorage.getItem(STORAGE_KEYS.STATS);
  if (!raw) return { username: getUsername(), wins: 0, losses: 0, draws: 0, gamesPlayed: 0, city: getCity(), elo: 1200 };
  const parsed = JSON.parse(raw) as PlayerStats;
  if (!parsed.elo) parsed.elo = 1200;
  return parsed;
}

export function saveStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));

  // Update leaderboard
  const lb = getLeaderboard();
  const idx = lb.findIndex(p => p.username === stats.username);
  if (idx >= 0) {
    lb[idx] = stats;
  } else {
    lb.push(stats);
  }
  lb.sort((a, b) => (b.elo ?? 1200) - (a.elo ?? 1200) || b.wins - a.wins);
  saveLeaderboard(lb);
}

export function getCoins(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEYS.COINS) || '0', 10);
}

export function addCoins(amount: number): number {
  if (typeof window === 'undefined') return 0;
  const current = getCoins();
  const newTotal = current + amount;
  localStorage.setItem(STORAGE_KEYS.COINS, String(newTotal));
  return newTotal;
}

export interface StreakData {
  count: number;
  lastDate: string;
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') return { count: 0, lastDate: '' };
  const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
  if (!raw) return { count: 0, lastDate: '' };
  return JSON.parse(raw);
}

export function updateStreak(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const streak = getStreak();

  if (streak.lastDate === today) {
    return streak.count;
  }

  let newCount: number;
  if (streak.lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (streak.lastDate === yesterdayStr) {
      newCount = streak.count + 1;
    } else {
      newCount = 1;
    }
  } else {
    newCount = 1;
  }

  const newStreak: StreakData = { count: newCount, lastDate: today };
  localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(newStreak));
  return newCount;
}

function calcElo(myElo: number, oppElo: number, result: 'win' | 'loss' | 'draw', gamesPlayed: number): number {
  const K = gamesPlayed < 20 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
  const actual = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
  return Math.max(100, Math.round(myElo + K * (actual - expected)));
}

export function recordGameResult(
  result: 'win' | 'loss' | 'draw',
  mode: string,
  opponent: string,
  moves: number,
  duration: number,
  extras?: GameExtras
): void {
  const stats = getStats();
  const username = getUsername();

  if (result === 'win') stats.wins++;
  else if (result === 'loss') stats.losses++;
  else stats.draws++;
  stats.gamesPlayed++;
  stats.username = username;
  stats.city = getCity();
  stats.elo = calcElo(stats.elo ?? 1200, extras?.opponentElo ?? 1200, result, stats.gamesPlayed - 1);

  saveStats(stats);
  // Sync to Supabase in background — fire and forget
  syncPlayerStats(stats).catch(() => {});
  addGameRecord({ mode, result, opponent, moves, duration }).catch(() => {});

  // Streak & coins
  updateStreak();
  const baseCoins = result === 'win' ? 20 : result === 'draw' ? 10 : 5;
  addCoins(baseCoins);
  if (extras) {
    const challengeCoins = checkAndUpdateChallenges(extras);
    if (challengeCoins > 0) addCoins(challengeCoins);
  }

  // Save to history
  const history = getGameHistory();
  const record: GameRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    mode,
    result,
    opponent,
    moves,
    duration,
    eloAfter: stats.elo,
  };
  history.unshift(record);
  // Keep last 50
  if (history.length > 50) history.pop();
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

export function getGameHistory(): GameRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export function getLeaderboard(): PlayerStats[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
  return raw ? JSON.parse(raw) : [];
}

function saveLeaderboard(lb: PlayerStats[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(lb));
}

export function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
}

export function setTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function isPro(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.PRO) === 'true';
}

export function setPro(val: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRO, val ? 'true' : 'false');
}

const SEEDED_USERNAMES = ['DragonKing99', 'CheckMaster', 'QueenSlayer', 'BoardWizard', 'NightRider', 'SteppeEagle', 'IronKnight', 'AlphaMove'];
const LEADERBOARD_SEED_VERSION = 'v3';

const FAKE_ENTRIES: PlayerStats[] = [
  { username: 'DragonKing99', wins: 142, losses: 23, draws: 8, gamesPlayed: 173, city: 'Almaty',    elo: 1847 },
  { username: 'CheckMaster',  wins: 98,  losses: 41, draws: 12, gamesPlayed: 151, city: 'Astana',   elo: 1634 },
  { username: 'QueenSlayer',  wins: 87,  losses: 55, draws: 5,  gamesPlayed: 147, city: 'Almaty',   elo: 1521 },
  { username: 'BoardWizard',  wins: 76,  losses: 48, draws: 9,  gamesPlayed: 133, city: 'Bishkek',  elo: 1478 },
  { username: 'NightRider',   wins: 64,  losses: 33, draws: 14, gamesPlayed: 111, city: 'Tashkent', elo: 1412 },
  { username: 'SteppeEagle',  wins: 58,  losses: 29, draws: 6,  gamesPlayed: 93,  city: 'Almaty',   elo: 1389 },
  { username: 'IronKnight',   wins: 51,  losses: 44, draws: 11, gamesPlayed: 106, city: 'Astana',   elo: 1298 },
  { username: 'AlphaMove',    wins: 45,  losses: 38, draws: 3,  gamesPlayed: 86,  city: 'Bishkek',  elo: 1243 },
];

// Seed/migrate leaderboard fake entries, preserving real user data
export function seedLeaderboardIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const version = localStorage.getItem('checkmate_lb_version');
  if (version === LEADERBOARD_SEED_VERSION) return;
  const lb = getLeaderboard();
  const realUsers = lb.filter(p => !SEEDED_USERNAMES.includes(p.username));
  saveLeaderboard([...FAKE_ENTRIES, ...realUsers]);
  localStorage.setItem('checkmate_lb_version', LEADERBOARD_SEED_VERSION);
}
