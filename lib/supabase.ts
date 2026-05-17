import { createClient } from '@supabase/supabase-js';
import type { PlayerStats } from './game-logic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function ensureAuth(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function syncPlayerStats(stats: PlayerStats): Promise<void> {
  const userId = await ensureAuth();
  if (!userId) return;
  await supabase.from('player_stats').upsert({
    user_id: userId,
    username: stats.username,
    city: stats.city ?? null,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    games_played: stats.gamesPlayed,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function addGameRecord(record: {
  mode: string;
  result: string;
  opponent: string;
  moves: number;
  duration: number;
}): Promise<void> {
  const userId = await ensureAuth();
  if (!userId) return;
  await supabase.from('game_history').insert({ user_id: userId, ...record });
}

export async function fetchLeaderboard(): Promise<PlayerStats[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('username, city, wins, losses, draws, games_played')
    .order('wins', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(row => ({
    username: row.username,
    city: row.city ?? undefined,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    gamesPlayed: row.games_played,
  }));
}
