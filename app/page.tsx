'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ModeSelector, { type GameMode } from '@/components/ModeSelector';
import GamePage from '@/components/GamePage';
import Leaderboard from '@/components/Leaderboard';
import UsernameModal from '@/components/UsernameModal';
import DailyChallenges from '@/components/DailyChallenges';
import {
  getUsername,
  getCity,
  getStats,
  getLeaderboard,
  getGameHistory,
  getTheme,
  setTheme,
  seedLeaderboardIfEmpty,
  getCoins,
  getStreak,
} from '@/lib/storage';
import { fetchLeaderboard, onAuthStateChange, type AuthUser } from '@/lib/supabase';
import type { Difficulty } from '@/lib/ai';
import type { PlayerStats, GameRecord } from '@/lib/game-logic';
import { Swords, Shield, Brain, Globe } from 'lucide-react';

type Screen = 'home' | 'game';

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [roomCode, setRoomCode] = useState<string | undefined>();
  const [username, setUsernameState] = useState('');
  const [city, setCityState] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [statsTab, setStatsTab] = useState<'stats' | 'history'>('stats');
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);

  // Load all localStorage state after hydration to avoid server/client mismatch
  useEffect(() => {
    const loadLocalState = setTimeout(() => {
      const name = getUsername();
      const userCity = getCity();
      setUsernameState(name);
      setCityState(userCity);
      setIsFirstTime(!name);
      setShowUsernameModal(!name);
      setThemeState(getTheme());
      setStats(getStats() ?? null);
      setHistory(getGameHistory());
      seedLeaderboardIfEmpty();
      setLeaderboard(getLeaderboard());
      setCoins(getCoins());
      setStreak(getStreak().count);

      // Then try to load real leaderboard from Supabase
      fetchLeaderboard().then(data => {
        if (data.length > 0) setLeaderboard(data);
      }).catch(() => {});
    }, 0);

    // Listen for Google auth state changes
    const unsubscribe = onAuthStateChange(user => setGoogleUser(user));

    return () => {
      clearTimeout(loadLocalState);
      unsubscribe();
    };
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    setTheme(newTheme);
  };

  const handleUsernameSet = (name: string, newCity: string) => {
    setUsernameState(name);
    setCityState(newCity);
    setIsFirstTime(false);
    setLeaderboard(getLeaderboard());
    setStats(getStats());
  };

  const handleModeSelect = (mode: GameMode, diff?: Difficulty, code?: string) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    if (code) setRoomCode(code);
    setScreen('game');
  };

  const handleExitGame = () => {
    setScreen('home');
    setStats(getStats());
    setHistory(getGameHistory());
    setCoins(getCoins());
    // Refresh leaderboard from Supabase after game
    fetchLeaderboard().then(data => {
      setLeaderboard(data.length > 0 ? data : getLeaderboard());
    }).catch(() => setLeaderboard(getLeaderboard()));
  };

  return (
    <div
      className={`min-h-screen ${theme === 'dark'
        ? 'bg-[#0d0f1a]'
        : 'bg-[#f0f4f8]'
      }`}
      style={{
        backgroundImage: theme === 'dark'
          ? 'radial-gradient(ellipse at 20% 20%, rgba(120,60,180,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(200,90,40,0.1) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 20% 20%, rgba(200,150,255,0.2) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,200,100,0.2) 0%, transparent 60%)',
      }}
    >
      <Navbar
        theme={theme}
        onThemeToggle={handleThemeToggle}
        username={username}
        onUsernameChange={() => setShowUsernameModal(true)}
        googleUser={googleUser}
        coins={coins}
      />

      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-20"
          >
            {/* Hero section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium"
                  >
                    Open Beta — v1.0
                  </motion.div>
                  {streak > 1 && (
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium"
                    >
                      🔥 {streak} day streak
                    </motion.div>
                  )}
                </div>

                {/* Guest nudge banner */}
                {!googleUser?.isGoogle && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center justify-center gap-3 mb-6"
                  >
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-gray-400'
                        : 'bg-white border-gray-200 text-gray-500 shadow-sm'
                    }`}>
                      <span>🎮 Playing as guest</span>
                      <span className="text-gray-600">·</span>
                      <button
                        onClick={() => {
                          import('@/lib/supabase').then(m => m.signInWithGoogle());
                        }}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google to save progress on all devices
                      </button>
                    </div>
                  </motion.div>
                )}

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`text-5xl md:text-7xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  CheckMate{' '}
                  <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
                    Arena
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-xl max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  The ultimate checkers experience. Challenge AI, play friends online, and master
                  the board with post-game coaching.
                </motion.p>

                {/* Stats bar */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center gap-8 mt-10"
                >
                  {[
                    { icon: <Swords size={16} />, label: 'Difficulty Levels', value: '3' },
                    { icon: <Brain size={16} />, label: 'AI Engine', value: 'Minimax α-β' },
                    { icon: <Globe size={16} />, label: 'Real-time', value: 'Socket.io' },
                    { icon: <Shield size={16} />, label: 'Free Forever', value: '100%' },
                  ].map((s, i) => (
                    <div key={i} className={`flex flex-col items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-amber-400">{s.icon}</div>
                      <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{s.value}</div>
                      <div className="text-xs">{s.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Main content grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Mode selector - takes 2 cols */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <div className={`rounded-3xl p-8 border ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-gray-200 shadow-lg'
                  }`}>
                    <ModeSelector onSelect={handleModeSelect} />
                  </div>
                </motion.div>

                {/* Right sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-6"
                >
                  {/* Personal stats + history */}
                  {username && stats && (
                    <div className={`rounded-2xl border ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white border-gray-200 shadow-md'
                    }`}>
                      {/* Tab bar */}
                      <div className={`flex border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                        {(['stats', 'history'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setStatsTab(tab)}
                            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors rounded-t-2xl ${
                              statsTab === tab
                                ? theme === 'dark'
                                  ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                                  : 'text-amber-600 border-b-2 border-amber-500 -mb-px'
                                : theme === 'dark'
                                  ? 'text-gray-500 hover:text-gray-300'
                                  : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      <div className="p-5">
                        {statsTab === 'stats' ? (
                          <>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                                {username[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{username}</div>
                                <div className="text-xs text-gray-400">{stats.gamesPlayed} games played</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'Wins', value: stats.wins, color: 'text-green-400' },
                                { label: 'Losses', value: stats.losses, color: 'text-red-400' },
                                { label: 'Draws', value: stats.draws, color: 'text-blue-400' },
                              ].map(s => (
                                <div key={s.label} className={`text-center p-2 rounded-xl ${
                                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                                }`}>
                                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                                  <div className="text-xs text-gray-400">{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {history.length === 0 ? (
                              <div className="text-center py-6 text-gray-500 text-sm">No games yet</div>
                            ) : (
                              history.slice(0, 20).map(g => {
                                const mins = Math.floor(g.duration / 60);
                                const secs = g.duration % 60;
                                const durStr = mins > 0
                                  ? `${mins}m ${secs}s`
                                  : `${secs}s`;
                                const modeIcon = g.mode === 'ai' ? '🤖' : g.mode === 'online' ? '🌐' : '👥';
                                const resultColor = g.result === 'win'
                                  ? 'text-green-400 bg-green-400/10'
                                  : g.result === 'loss'
                                  ? 'text-red-400 bg-red-400/10'
                                  : 'text-blue-400 bg-blue-400/10';
                                const dateStr = new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                return (
                                  <div
                                    key={g.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                                      theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                                    }`}
                                  >
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg uppercase ${resultColor}`}>
                                      {g.result[0]}
                                    </span>
                                    <span className="text-sm">{modeIcon}</span>
                                    <span className={`flex-1 text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                      vs {g.opponent}
                                    </span>
                                    <span className="text-xs text-gray-500">{durStr}</span>
                                    <span className="text-xs text-gray-600">{dateStr}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <Leaderboard entries={leaderboard} currentUsername={username} theme={theme} />

                  {/* Daily Challenges */}
                  <DailyChallenges />
                </motion.div>
              </div>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid md:grid-cols-3 gap-4 mt-12"
              >
                {[
                  {
                    emoji: '🧠',
                    title: 'AI Coach',
                    desc: 'Post-game analysis highlights missed captures and strategic errors',
                  },
                  {
                    emoji: '⚡',
                    title: 'Real-time Multiplayer',
                    desc: 'Challenge friends anywhere with instant room codes via Socket.io',
                  },
                  {
                    emoji: '📊',
                    title: 'Track Progress',
                    desc: 'Local leaderboard and win/loss stats saved to your browser',
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl border ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="text-3xl mb-3">{f.emoji}</div>
                    <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {f.title}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="text-center py-8 text-gray-600 text-sm">
              <p>CheckMate Arena © 2024 — Built with Next.js, Socket.io, and Framer Motion</p>
            </div>
          </motion.div>
        )}

        {screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GamePage
              mode={gameMode}
              difficulty={difficulty}
              roomCode={roomCode}
              username={username}
              onExit={handleExitGame}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Username modal */}
      <AnimatePresence>
        {showUsernameModal && (
          <UsernameModal
            currentUsername={username}
            currentCity={city}
            onSave={handleUsernameSet}
            onClose={() => setShowUsernameModal(false)}
            required={isFirstTime}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
