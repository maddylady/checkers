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
    lb.push({ username: name, wins: 0, losses: 0, draws: 0, gamesPlayed: 0, city: getCity() });
    saveLeaderboard(lb);
  }
}

export function getStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return { username: '', wins: 0, losses: 0, draws: 0, gamesPlayed: 0 };
  }
  const raw = localStorage.getItem(STORAGE_KEYS.STATS);
  if (!raw) return { username: getUsername(), wins: 0, losses: 0, draws: 0, gamesPlayed: 0, city: getCity() };
  return JSON.parse(raw);
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
  // Sort by wins descending
  lb.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
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

// Seed some fake leaderboard entries for demo
export function seedLeaderboardIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const lb = getLeaderboard();
  if (lb.length === 0) {
    const fakeEntries: PlayerStats[] = [
      { username: 'DragonKing99', wins: 142, losses: 23, draws: 8, gamesPlayed: 173, city: 'Almaty' },
      { username: 'CheckMaster', wins: 98, losses: 41, draws: 12, gamesPlayed: 151, city: 'Astana' },
      { username: 'QueenSlayer', wins: 87, losses: 55, draws: 5, gamesPlayed: 147, city: 'Almaty' },
      { username: 'BoardWizard', wins: 76, losses: 48, draws: 9, gamesPlayed: 133, city: 'Bishkek' },
      { username: 'NightRider', wins: 64, losses: 33, draws: 14, gamesPlayed: 111, city: 'Tashkent' },
      { username: 'SteppeEagle', wins: 58, losses: 29, draws: 6, gamesPlayed: 93, city: 'Almaty' },
      { username: 'IronKnight', wins: 51, losses: 44, draws: 11, gamesPlayed: 106, city: 'Astana' },
      { username: 'AlphaMove', wins: 45, losses: 38, draws: 3, gamesPlayed: 86, city: 'Bishkek' },
    ];
    saveLeaderboard(fakeEntries);
  }
}
