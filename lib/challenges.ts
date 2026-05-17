export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  text: string;
  emoji: string;
  difficulty: ChallengeDifficulty;
  coins: number;
  type: string;
  target?: number;
  requiredMode?: string;
  requiredDifficulty?: string;
}

export interface ChallengeProgress {
  completed: boolean;
  progress: number;
}

export interface DailyState {
  date: string;
  easy: ChallengeProgress;
  medium: ChallengeProgress;
  hard: ChallengeProgress;
}

export interface GameExtras {
  result: 'win' | 'loss' | 'draw';
  mode: string;
  aiDifficulty?: string;
  moves: number;
  playerCaptures: number;
  piecesLost: number;
  kingsOnBoard: number;
}

const DAILY_PROGRESS_KEY = 'checkmate_daily_progress';

const easyBank: Challenge[] = [
  { id: 'e0', text: 'Play 2 games', emoji: '🎮', difficulty: 'easy', coins: 10, type: 'play_n', target: 2 },
  { id: 'e1', text: 'Win any game', emoji: '🏆', difficulty: 'easy', coins: 10, type: 'win_any' },
  { id: 'e2', text: 'Make 3 captures in one game', emoji: '💥', difficulty: 'easy', coins: 10, type: 'captures_n', target: 3 },
  { id: 'e3', text: 'Get a King', emoji: '👑', difficulty: 'easy', coins: 10, type: 'get_king' },
  { id: 'e4', text: 'Win vs AI (Easy)', emoji: '🤖', difficulty: 'easy', coins: 10, type: 'win_difficulty', requiredDifficulty: 'easy' },
  { id: 'e5', text: 'Play 3 games', emoji: '🎯', difficulty: 'easy', coins: 10, type: 'play_n', target: 3 },
  { id: 'e6', text: 'Make 5 captures in one game', emoji: '🔥', difficulty: 'easy', coins: 10, type: 'captures_n', target: 5 },
];

const mediumBank: Challenge[] = [
  { id: 'm0', text: 'Win vs AI (Medium)', emoji: '⚔️', difficulty: 'medium', coins: 25, type: 'win_difficulty', requiredDifficulty: 'medium' },
  { id: 'm1', text: 'Win in Mines Mode', emoji: '💣', difficulty: 'medium', coins: 25, type: 'win_mode', requiredMode: 'mines' },
  { id: 'm2', text: 'Win in under 25 moves', emoji: '⚡', difficulty: 'medium', coins: 25, type: 'win_in_moves', target: 25 },
  { id: 'm3', text: 'Make 6 captures in one game', emoji: '🎳', difficulty: 'medium', coins: 25, type: 'captures_n', target: 6 },
  { id: 'm4', text: 'Win in Roulette Mode', emoji: '🎰', difficulty: 'medium', coins: 25, type: 'win_mode', requiredMode: 'roulette' },
  { id: 'm5', text: 'Get 2 Kings in one game', emoji: '👑', difficulty: 'medium', coins: 25, type: 'kings_n', target: 2 },
  { id: 'm6', text: 'Win 2 games in a row', emoji: '🔄', difficulty: 'medium', coins: 25, type: 'win_streak', target: 2 },
];

const hardBank: Challenge[] = [
  { id: 'h0', text: 'Win without losing a piece', emoji: '🛡️', difficulty: 'hard', coins: 50, type: 'win_no_loss' },
  { id: 'h1', text: 'Win vs AI (Hard)', emoji: '🤖', difficulty: 'hard', coins: 50, type: 'win_difficulty', requiredDifficulty: 'hard' },
  { id: 'h2', text: 'Win in under 20 moves', emoji: '⚡', difficulty: 'hard', coins: 50, type: 'win_in_moves', target: 20 },
  { id: 'h3', text: 'Win in Roulette Mode on Hard', emoji: '🎰', difficulty: 'hard', coins: 50, type: 'win_mode_difficulty', requiredMode: 'roulette', requiredDifficulty: 'hard' },
  { id: 'h4', text: 'Win in Mines Mode on Hard', emoji: '💣', difficulty: 'hard', coins: 50, type: 'win_mode_difficulty', requiredMode: 'mines', requiredDifficulty: 'hard' },
  { id: 'h5', text: 'Win 3 games in a row', emoji: '🔥', difficulty: 'hard', coins: 50, type: 'win_streak', target: 3 },
  { id: 'h6', text: 'Make 8 captures in one game', emoji: '💥', difficulty: 'hard', coins: 50, type: 'captures_n', target: 8 },
];

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDayIndex(): number {
  return Math.floor((Date.now() - new Date('2024-01-01').getTime()) / 86400000);
}

export function getDailyChallenges(): [Challenge, Challenge, Challenge] {
  const idx = getDayIndex();
  return [
    easyBank[idx % easyBank.length],
    mediumBank[idx % mediumBank.length],
    hardBank[idx % hardBank.length],
  ];
}

export function getDailyProgress(): DailyState {
  if (typeof window === 'undefined') {
    const today = getTodayISO();
    return { date: today, easy: { completed: false, progress: 0 }, medium: { completed: false, progress: 0 }, hard: { completed: false, progress: 0 } };
  }
  const raw = localStorage.getItem(DAILY_PROGRESS_KEY);
  const today = getTodayISO();
  if (raw) {
    const state: DailyState = JSON.parse(raw);
    if (state.date === today) return state;
  }
  // Reset for new day
  return { date: today, easy: { completed: false, progress: 0 }, medium: { completed: false, progress: 0 }, hard: { completed: false, progress: 0 } };
}

export function saveDailyProgress(state: DailyState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(state));
}

function evaluateChallenge(challenge: Challenge, extras: GameExtras, prog: ChallengeProgress): { completed: boolean; newProgress: number } {
  let newProgress = prog.progress;
  let completed = prog.completed;

  if (completed) return { completed, newProgress };

  switch (challenge.type) {
    case 'play_n':
      newProgress++;
      if (newProgress >= (challenge.target ?? 1)) completed = true;
      break;
    case 'win_any':
      if (extras.result === 'win') completed = true;
      break;
    case 'win_difficulty':
      if (extras.result === 'win' && extras.aiDifficulty === challenge.requiredDifficulty) completed = true;
      break;
    case 'win_mode':
      if (extras.result === 'win' && extras.mode === challenge.requiredMode) completed = true;
      break;
    case 'win_mode_difficulty':
      if (extras.result === 'win' && extras.mode === challenge.requiredMode && extras.aiDifficulty === challenge.requiredDifficulty) completed = true;
      break;
    case 'captures_n':
      if (extras.playerCaptures >= (challenge.target ?? 1)) completed = true;
      break;
    case 'get_king':
      if (extras.kingsOnBoard >= 1) completed = true;
      break;
    case 'kings_n':
      if (extras.kingsOnBoard >= (challenge.target ?? 1)) completed = true;
      break;
    case 'win_in_moves':
      if (extras.result === 'win' && extras.moves <= (challenge.target ?? 99)) completed = true;
      break;
    case 'win_no_loss':
      if (extras.result === 'win' && extras.piecesLost === 0) completed = true;
      break;
    case 'win_streak':
      if (extras.result === 'win') {
        newProgress++;
      } else {
        newProgress = 0;
      }
      if (newProgress >= (challenge.target ?? 1)) completed = true;
      break;
    default:
      break;
  }

  return { completed, newProgress };
}

export function checkAndUpdateChallenges(extras: GameExtras): number {
  const [easy, medium, hard] = getDailyChallenges();
  const state = getDailyProgress();
  let coinsEarned = 0;

  const diffs: Array<{ key: 'easy' | 'medium' | 'hard'; challenge: Challenge }> = [
    { key: 'easy', challenge: easy },
    { key: 'medium', challenge: medium },
    { key: 'hard', challenge: hard },
  ];

  for (const { key, challenge } of diffs) {
    const prog = state[key];
    if (prog.completed) continue;
    const { completed, newProgress } = evaluateChallenge(challenge, extras, prog);
    state[key] = { completed, progress: newProgress };
    if (completed && !prog.completed) {
      coinsEarned += challenge.coins;
    }
  }

  saveDailyProgress(state);
  return coinsEarned;
}
