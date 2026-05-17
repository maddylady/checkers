'use client';
import SkinShop from '@/components/SkinShop';
import BadgeUnlockModal from '@/components/BadgeUnlockModal';
import { BADGES, type Badge } from '@/lib/badges';
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

type Screen = 'home' | 'game';

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [roomCode, setRoomCode] = useState<string | undefined>();
  const [botName, setBotName] = useState<string | undefined>();
  const [username, setUsernameState] = useState('');
  const [city, setCityState] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'leaderboard' | 'stats' | 'challenges'>('leaderboard');
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
  const [coins, setCoins] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
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

  const handleModeSelect = (mode: GameMode, diff?: Difficulty, code?: string, name?: string) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    if (code) setRoomCode(code);
    setBotName(name);
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
        onShopOpen={() => setShowShop(true)}
      />

      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-16 min-h-screen"
          >
            <div className="max-w-6xl mx-auto px-4 py-4">

              {/* Main two-column grid */}
              <div className="grid lg:grid-cols-5 gap-5 items-start">

                {/* Left — Mode Selector */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-3"
                >
                  <div className={`rounded-3xl p-6 border ${
                    theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
                  }`}>
                    <ModeSelector onSelect={handleModeSelect} />
                  </div>
                </motion.div>

                {/* Right — Tabbed sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 flex flex-col gap-3"
                >
                  {/* Tab switcher */}
                  <div className={`flex p-1 rounded-2xl border ${
                    theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                  }`}>
                    {([
                      { id: 'leaderboard', label: '🏆 Top' },
                      { id: 'stats',       label: '📊 Stats' },
                      { id: 'challenges',  label: '🎯 Daily' },
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSidebarTab(tab.id)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                          sidebarTab === tab.id
                            ? theme === 'dark'
                              ? 'bg-white/15 text-white shadow-sm'
                              : 'bg-white text-gray-900 shadow-sm'
                            : theme === 'dark'
                              ? 'text-gray-500 hover:text-gray-300'
                              : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    {sidebarTab === 'leaderboard' && (
                      <motion.div key="lb" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Leaderboard entries={leaderboard} currentUsername={username} theme={theme} />
                      </motion.div>
                    )}

                    {sidebarTab === 'stats' && (
                      <motion.div key="stats" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className={`rounded-2xl border p-4 ${
                          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-md'
                        }`}>
                          {username && stats ? (
                            <>
                              {/* Player row */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {username[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className={`font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{username}</div>
                                  <div className="text-xs text-gray-400">{stats.gamesPlayed} games · {stats.gamesPlayed > 0 ? Math.round(stats.wins / stats.gamesPlayed * 100) : 0}% win rate</div>
                                </div>
                              </div>

                              {/* W / L / D */}
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                  { label: 'Wins',   value: stats.wins,   color: 'text-green-400' },
                                  { label: 'Losses', value: stats.losses, color: 'text-red-400'   },
                                  { label: 'Draws',  value: stats.draws,  color: 'text-blue-400'  },
                                ].map(s => (
                                  <div key={s.label} className={`text-center p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                                    <div className="text-xs text-gray-400">{s.label}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Recent games */}
                              {history.length > 0 && (
                                <>
                                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Recent</div>
                                  <div className="space-y-1.5">
                                    {history.slice(0, 6).map(g => {
                                      const modeIcon = g.mode === 'ai' ? '🤖' : g.mode === 'online' ? '🌐' : g.mode === 'mines' ? '💣' : g.mode === 'roulette' ? '🎰' : '👥';
                                      const rc = g.result === 'win' ? 'text-green-400 bg-green-400/10' : g.result === 'loss' ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10';
                                      const dateStr = new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                      return (
                                        <div key={g.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg uppercase ${rc}`}>{g.result[0]}</span>
                                          <span className="text-xs">{modeIcon}</span>
                                          <span className={`flex-1 text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>vs {g.opponent}</span>
                                          <span className="text-xs text-gray-500 flex-shrink-0">{dateStr}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-10">
                              <div className="text-4xl mb-3">🎮</div>
                              <div className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {username ? 'No games yet' : 'Set your username first'}
                              </div>
                              <div className="text-sm text-gray-500">Play a game to see your stats here</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {sidebarTab === 'challenges' && (
                      <motion.div key="challenges" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <DailyChallenges />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

            </div>

            <div className="text-center py-6 text-gray-600 text-sm">
              CheckMate Arena © 2025 — Next.js · Socket.io · Framer Motion
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
              botName={botName}
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
      {showShop && (
          <SkinShop
              onClose={() => setShowShop(false)}
              onCoinsChange={() => setCoins(getCoins())}
          />
      )}
      <BadgeUnlockModal badge={newBadge} onClose={() => setNewBadge(null)} />
    </div>
  );
}
