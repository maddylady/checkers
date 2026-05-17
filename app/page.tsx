'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ModeSelector, { type GameMode } from '@/components/ModeSelector';
import GamePage from '@/components/GamePage';
import Leaderboard from '@/components/Leaderboard';
import UsernameModal from '@/components/UsernameModal';
import {
  getUsername,
  getCity,
  getStats,
  getLeaderboard,
  getGameHistory,
  getTheme,
  setTheme,
  seedLeaderboardIfEmpty,
} from '@/lib/storage';
import { fetchLeaderboard } from '@/lib/supabase';
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

      // Then try to load real leaderboard from Supabase
      fetchLeaderboard().then(data => {
        if (data.length > 0) setLeaderboard(data);
      }).catch(() => {});
    }, 0);

    return () => clearTimeout(loadLocalState);
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
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live players online now
                </motion.div>

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
                    { icon: <Swords size={16} />, label: 'Games Played', value: '50,000+' },
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
