import { createClient } from '@supabase/supabase-js';
import type { PlayerStats } from './game-logic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function ensureAuth(): Promise<string | null> {
  if (!supabase) return null;

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
  if (!supabase || !userId) return;

  const { error } = await supabase.from('player_stats').upsert({
    user_id: userId,
    username: stats.username,
    city: stats.city ?? null,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    games_played: stats.gamesPlayed,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) console.error('[Supabase] player_stats upsert error:', error);
}

export async function addGameRecord(record: {
  mode: string;
  result: string;
  opponent: string;
  moves: number;
  duration: number;
}): Promise<void> {
  const userId = await ensureAuth();
  if (!supabase || !userId) return;

  const { error } = await supabase.from('game_history').insert({ user_id: userId, ...record });
  if (error) console.error('[Supabase] game_history insert error:', error);
}

export interface AuthUser {
  id: string;
  isGoogle: boolean;
  name?: string;
  avatar?: string;
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' },
  });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getAuthUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    isGoogle: u.app_metadata?.provider === 'google',
    name: u.user_metadata?.full_name ?? u.user_metadata?.name,
    avatar: u.user_metadata?.avatar_url,
  };
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) { callback(null); return; }
    const u = session.user;
    callback({
      id: u.id,
      isGoogle: u.app_metadata?.provider === 'google',
      name: u.user_metadata?.full_name ?? u.user_metadata?.name,
      avatar: u.user_metadata?.avatar_url,
    });
  });
  return () => data.subscription.unsubscribe();
}

export async function fetchLeaderboard(): Promise<PlayerStats[]> {
  if (!supabase) return [];

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
    elo: 1200,
  }));
}
