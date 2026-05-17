'use client';
import SkinShop from '@/components/SkinShop';
import BadgeUnlockModal from '@/components/BadgeUnlockModal';
import ProfileModal from '@/components/ProfileModal';
import { BADGES, type Badge } from '@/lib/badges';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ModeSelector, { type GameMode, type TimeControl } from '@/components/ModeSelector';
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
  getRulesVariant,
  setRulesVariant,
} from '@/lib/storage';
import { fetchLeaderboard, onAuthStateChange, type AuthUser } from '@/lib/supabase';
import type { Difficulty } from '@/lib/ai';
import type { PlayerStats, GameRecord, RulesVariant } from '@/lib/game-logic';

type Screen = 'home' | 'game';

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [roomCode, setRoomCode] = useState<string | undefined>();
  const [botName, setBotName] = useState<string | undefined>();
  const [botElo, setBotElo] = useState<number | undefined>();
  const [username, setUsernameState] = useState('');
  const [city, setCityState] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'leaderboard' | 'stats' | 'challenges' | 'rules'>('leaderboard');
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
  const [coins, setCoins] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [rulesVariant, setRulesVariantState] = useState<RulesVariant>('american');
  const [selectorKey, setSelectorKey] = useState(0);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [streak, setStreak] = useState(0);
  const [viewingPlayer, setViewingPlayer] = useState<import('@/lib/game-logic').PlayerStats | null>(null);
  const [selectorStep, setSelectorStep] = useState<string>('mode');
  const [timeControl, setTimeControl] = useState<TimeControl>({ type: 'move', seconds: 30, expiry: 'random' });

  // Load all localStorage state after hydration to avoid server/client mismatch
  useEffect(() => {
    const loadLocalState = setTimeout(() => {
      const name = getUsername();
      const userCity = getCity();
      setUsernameState(name);
      setCityState(userCity);
      setIsFirstTime(!name);
      setShowUsernameModal(!name);
      const savedTheme = getTheme();
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      setStats(getStats() ?? null);
      setHistory(getGameHistory());
      seedLeaderboardIfEmpty();
      setLeaderboard(getLeaderboard());
      setCoins(getCoins());
      setStreak(getStreak().count);
      setRulesVariantState(getRulesVariant());

      // Merge Supabase leaderboard with local ELOs (Supabase has no ELO column)
      fetchLeaderboard().then(data => {
        if (data.length > 0) {
          const local = getLeaderboard();
          const merged = data.map(row => ({
            ...row,
            elo: local.find(p => p.username === row.username)?.elo ?? 1200,
          }));
          setLeaderboard(merged);
        }
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
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleUsernameSet = (name: string, newCity: string) => {
    setUsernameState(name);
    setCityState(newCity);
    setIsFirstTime(false);
    setLeaderboard(getLeaderboard());
    setStats(getStats());
  };

  const handleModeSelect = (mode: GameMode, diff?: Difficulty, code?: string, name?: string, elo?: number, tc?: TimeControl, variant?: RulesVariant) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    if (code) setRoomCode(code);
    setBotName(name);
    setBotElo(elo);
    if (tc) setTimeControl(tc);
    if (variant) setRulesVariantState(variant);
    setScreen('game');
  };

  const handleExitGame = () => {
    setScreen('home');
    setSelectorStep('mode');
    setStats(getStats());
    setHistory(getGameHistory());
    setCoins(getCoins());
    // Refresh leaderboard from Supabase after game
    fetchLeaderboard().then(data => {
      if (data.length > 0) {
        const local = getLeaderboard();
        const merged = data.map(row => ({
          ...row,
          elo: local.find(p => p.username === row.username)?.elo ?? 1200,
        }));
        setLeaderboard(merged);
      } else {
        setLeaderboard(getLeaderboard());
      }
    }).catch(() => setLeaderboard(getLeaderboard()));
  };

  return (
    <div
      className="min-h-screen bg-[#f0f4f8] dark:bg-[#0d0f1a]"
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
        onLogoClick={() => { setScreen('home'); setSelectorKey(k => k + 1); setSelectorStep('mode'); }}
        onProfileOpen={() => setShowProfile(true)}
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
              <div className={`grid gap-5 items-start ${selectorStep === 'mode' ? 'lg:grid-cols-5' : 'lg:grid-cols-1'}`}>

                {/* Left — Mode Selector */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={selectorStep === 'mode' ? 'lg:col-span-3' : 'col-span-full'}
                >
                  <div className="rounded-3xl p-4 border bg-white border-gray-200 dark:bg-gray-900/80 dark:border-white/10 backdrop-blur-sm shadow-lg">
                    <ModeSelector
                      key={selectorKey}
                      onSelect={handleModeSelect}
                      onStepChange={setSelectorStep}
                      rulesVariant={rulesVariant}
                      onVariantChange={(v) => { setRulesVariantState(v); setRulesVariant(v); }}
                    />
                  </div>
                </motion.div>

                {/* Right — Tabbed sidebar */}
                <AnimatePresence>
                {selectorStep === 'mode' && (
                <motion.div
                  key="sidebar"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="lg:col-span-2 flex flex-col gap-3"
                >
                  {/* Tab switcher */}
                  <div className="flex p-1 rounded-2xl border bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/10">
                    {([
                      { id: 'leaderboard', label: '🏆 Top' },
                      { id: 'stats',       label: '📊 Stats' },
                      { id: 'challenges',  label: '🎯 Daily' },
                      { id: 'rules',       label: '📖 Rules' },
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSidebarTab(tab.id)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                          sidebarTab === tab.id
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white'
                            : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
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
                        <Leaderboard
                          entries={leaderboard}
                          currentUsername={username}
                          theme={theme}
                          onPlayerClick={p => setViewingPlayer(p)}
                        />
                      </motion.div>
                    )}

                    {sidebarTab === 'stats' && (
                      <motion.div key="stats" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="rounded-2xl border p-4 bg-white border-gray-200 dark:bg-white/5 dark:border-white/10">
                          {username && stats ? (
                            <>
                              {/* Player row */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {username[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold truncate text-gray-900 dark:text-white">{username}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{stats.gamesPlayed} games played</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-black text-amber-400">{stats.elo ?? 1200}</div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">ELO</div>
                                </div>
                              </div>

                              {/* W / L / D */}
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                  { label: 'Wins',   value: stats.wins,   color: 'text-green-500' },
                                  { label: 'Losses', value: stats.losses, color: 'text-red-500'   },
                                  { label: 'Draws',  value: stats.draws,  color: 'text-blue-500'  },
                                ].map(s => (
                                  <div key={s.label} className="text-center p-2.5 rounded-xl bg-gray-100 dark:bg-white/5">
                                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Recent games */}
                              {history.length > 0 && (
                                <>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-2">Recent</div>
                                  <div className="space-y-1.5">
                                    {history.slice(0, 6).map(g => {
                                      const modeIcon = g.mode === 'ai' ? '🤖' : g.mode === 'online' ? '🌐' : g.mode === 'mines' ? '💣' : g.mode === 'roulette' ? '🎰' : '👥';
                                      const rc = g.result === 'win' ? 'text-green-500 bg-green-400/10' : g.result === 'loss' ? 'text-red-500 bg-red-400/10' : 'text-blue-500 bg-blue-400/10';
                                      const dateStr = new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                      return (
                                        <div key={g.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5">
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg uppercase ${rc}`}>{g.result[0]}</span>
                                          <span className="text-xs">{modeIcon}</span>
                                          <span className="flex-1 text-xs truncate text-gray-600 dark:text-gray-300">vs {g.opponent}</span>
                                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{dateStr}</span>
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
                              <div className="font-semibold mb-1 text-gray-900 dark:text-white">
                                {username ? 'No games yet' : 'Set your username first'}
                              </div>
                              <div className="text-sm text-gray-400 dark:text-gray-500">Play a game to see your stats here</div>
                            </div>
                          )}
                          {username && stats && (
                            <button
                              onClick={() => setShowProfile(true)}
                              className="w-full mt-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              View Full Profile →
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {sidebarTab === 'challenges' && (
                      <motion.div key="challenges" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <DailyChallenges />
                      </motion.div>
                    )}

                    {sidebarTab === 'rules' && (
                      <motion.div key="rules" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="rounded-2xl border p-4 bg-white border-gray-200 dark:bg-white/5 dark:border-white/10 space-y-4">

                          {/* Variant picker */}
                          <div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-2">Ruleset</div>
                            <div className="grid grid-cols-2 gap-2">
                              {([
                                { value: 'american', flag: '🇺🇸', label: 'American' },
                                { value: 'russian',  flag: '🇷🇺', label: 'Russian'  },
                              ] as const).map(v => (
                                <button
                                  key={v.value}
                                  onClick={() => { setRulesVariantState(v.value); setRulesVariant(v.value); }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                    rulesVariant === v.value
                                      ? v.value === 'american'
                                        ? 'border-amber-500 bg-amber-500/15 text-amber-500'
                                        : 'border-blue-500 bg-blue-500/15 text-blue-500'
                                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <span>{v.flag}</span>
                                  <span>{v.label}</span>
                                  {rulesVariant === v.value && <span className="ml-auto text-xs">✓</span>}
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">Takes effect on your next game.</p>
                          </div>

                          {/* Quick rules */}
                          <div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-2">How to play</div>
                            <div className="space-y-2">
                              {[
                                { icon: '🎯', title: 'Goal', text: 'Capture all opponent pieces or leave them with no legal move.' },
                                { icon: '↗️', title: 'Movement', text: 'Pieces move diagonally forward. Kings move in all 4 diagonal directions.' },
                                { icon: '💥', title: 'Mandatory capture', text: 'If a capture is available you must take it — no skipping.' },
                                { icon: '🔗', title: 'Multi-jump', text: 'After a capture, continue jumping with the same piece if possible.' },
                                { icon: '👑', title: 'Promotion', text: 'Reach the far row to become a King with enhanced movement.' },
                              ].map(r => (
                                <div key={r.icon} className="flex gap-2.5 items-start">
                                  <span className="text-base flex-shrink-0 mt-0.5">{r.icon}</span>
                                  <div>
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{r.title} </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{r.text}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Variant difference callout */}
                          <div className={`rounded-xl p-3 text-xs ${
                            rulesVariant === 'russian'
                              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                          }`}>
                            {rulesVariant === 'russian'
                              ? '🇷🇺 Russian: Kings are flying — slide any distance. Regular pieces capture backward too. Promotion mid-chain continues as a king.'
                              : '🇺🇸 American: Kings move 1 square only. Captures are forward only for regular pieces. Promotion ends the capture chain.'}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                )}
                </AnimatePresence>
              </div>

            </div>

            <div className="text-center py-6 text-gray-400 dark:text-gray-600 text-sm">
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
              botElo={botElo}
              onExit={handleExitGame}
              rulesVariant={rulesVariant}
              timeControl={timeControl}
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
      {showProfile && (
        <ProfileModal
          stats={stats ?? { username, wins: 0, losses: 0, draws: 0, gamesPlayed: 0, elo: 1200 }}
          history={history}
          streak={streak}
          coins={coins}
          onClose={() => setShowProfile(false)}
        />
      )}
      {viewingPlayer && (
        <ProfileModal
          stats={viewingPlayer}
          history={[]}
          streak={0}
          onClose={() => setViewingPlayer(null)}
        />
      )}
    </div>
  );
}
