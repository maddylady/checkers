'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ChevronRight, Wifi, Zap, Shuffle } from 'lucide-react';
import type { Difficulty } from '@/lib/ai';
import type { RulesVariant } from '@/lib/game-logic';

export type GameMode = 'ai' | 'local' | 'online' | 'mines' | 'roulette';

export type TimeControl =
  | { type: 'none' }
  | { type: 'move'; seconds: number; expiry: 'random' | 'lose' }
  | { type: 'game'; seconds: number };

interface ModeSelectorProps {
  onSelect: (
    mode: GameMode,
    difficulty?: Difficulty,
    roomCode?: string,
    botName?: string,
    botElo?: number,
    timeControl?: TimeControl,
    rulesVariant?: RulesVariant,
  ) => void;
  onStepChange?: (step: string) => void;
  rulesVariant?: RulesVariant;
  onVariantChange?: (v: RulesVariant) => void;
}

interface BotCharacter {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  difficulty: Difficulty;
  color: string;
  elo: number;
}

const bots: BotCharacter[] = [
  // ── Beginner ──────────────────────────────────────────────────────────────
  {
    id: 'grandma', name: 'Grandma Rose', emoji: '👵',
    tagline: 'Offers you tea. Forgets to capture.',
    difficulty: 'easy', color: 'from-pink-500 to-rose-400', elo: 420,
  },
  {
    id: 'chicky', name: 'Chicky', emoji: '🐣',
    tagline: 'Day 1. Has absolutely no idea.',
    difficulty: 'easy', color: 'from-yellow-400 to-amber-300', elo: 350,
  },
  {
    id: 'lucky', name: 'Lucky Larry', emoji: '🎲',
    tagline: 'Strategy? Never heard of her.',
    difficulty: 'easy', color: 'from-teal-500 to-cyan-400', elo: 510,
  },
  {
    id: 'jester', name: 'The Jester', emoji: '🤡',
    tagline: 'One blunder at a time. Laughing all the way.',
    difficulty: 'easy', color: 'from-orange-400 to-yellow-300', elo: 480,
  },

  // ── Intermediate ──────────────────────────────────────────────────────────
  {
    id: 'detective', name: 'Detective Dan', emoji: '🕵️',
    tagline: 'Elementary — your pieces are in danger.',
    difficulty: 'medium', color: 'from-blue-600 to-indigo-500', elo: 1050,
  },
  {
    id: 'gordon', name: 'Gordon Ramsay', emoji: '🧑‍🍳',
    tagline: 'Your last move was absolutely RAW.',
    difficulty: 'medium', color: 'from-red-500 to-orange-400', elo: 1120,
  },
  {
    id: 'elon', name: 'Elon Musk', emoji: '🚀',
    tagline: 'Moves fast. Breaks your game plan.',
    difficulty: 'medium', color: 'from-slate-600 to-gray-500', elo: 1280,
  },
  {
    id: 'coach', name: 'The Coach', emoji: '🏀',
    tagline: 'Box out, fundamentals, no excuses.',
    difficulty: 'medium', color: 'from-amber-600 to-orange-500', elo: 1190,
  },
  {
    id: 'bookworm', name: 'The Bookworm', emoji: '📚',
    tagline: 'Has memorised every checkers theory.',
    difficulty: 'medium', color: 'from-violet-600 to-purple-500', elo: 1160,
  },
  {
    id: 'bezos', name: 'Jeff Bezos', emoji: '📦',
    tagline: 'Day 1. Every move optimised for long-term domination.',
    difficulty: 'medium', color: 'from-orange-600 to-yellow-500', elo: 1210,
  },
  {
    id: 'jobs', name: 'Steve Jobs', emoji: '🍎',
    tagline: 'One more move. Insanely great, or nothing.',
    difficulty: 'medium', color: 'from-gray-500 to-gray-400', elo: 1140,
  },
  {
    id: 'arman', name: 'Arman Suleimenov', emoji: '🦁',
    tagline: 'Built from the steppe. Plays like he has something to prove.',
    difficulty: 'medium', color: 'from-sky-600 to-blue-500', elo: 1250,
  },

  // ── Expert ────────────────────────────────────────────────────────────────
  {
    id: 'brucelee', name: 'Bruce Lee', emoji: '🥋',
    tagline: "Be like water. Your pieces won't know what hit them.",
    difficulty: 'hard', color: 'from-yellow-600 to-amber-400', elo: 1890,
  },
  {
    id: 'buffett', name: 'Warren Buffett', emoji: '📈',
    tagline: 'Patient. Disciplined. Holding your pieces hostage since move 3.',
    difficulty: 'hard', color: 'from-green-700 to-emerald-500', elo: 1760,
  },
  {
    id: 'napoleon', name: 'Napoleon', emoji: '🫅',
    tagline: 'Every piece an army. Every move a campaign.',
    difficulty: 'hard', color: 'from-blue-800 to-blue-600', elo: 1820,
  },
  {
    id: 'cleopatra', name: 'Cleopatra', emoji: '👑',
    tagline: 'Beautiful, cunning, and utterly ruthless.',
    difficulty: 'hard', color: 'from-amber-600 to-yellow-500', elo: 1870,
  },
  {
    id: 'suntzu', name: 'Sun Tzu', emoji: '☯️',
    tagline: 'The supreme art is to win without fighting.',
    difficulty: 'hard', color: 'from-emerald-700 to-teal-500', elo: 1960,
  },
  {
    id: 'genghis', name: 'Genghis Khan', emoji: '⚔️',
    tagline: 'Overwhelm. Conquer. Leave nothing behind.',
    difficulty: 'hard', color: 'from-red-800 to-orange-600', elo: 1940,
  },
  {
    id: 'einstein', name: 'Albert Einstein', emoji: '🧠',
    tagline: 'Your defeat is relatively inevitable.',
    difficulty: 'hard', color: 'from-indigo-700 to-violet-600', elo: 2080,
  },
  {
    id: 'magnus', name: 'Magnus Jr.', emoji: '♟️',
    tagline: 'Born to dominate. No off days.',
    difficulty: 'hard', color: 'from-amber-700 to-amber-500', elo: 2050,
  },
  {
    id: 'oracle', name: 'The Oracle', emoji: '👁️',
    tagline: 'Already knows how this ends for you.',
    difficulty: 'hard', color: 'from-purple-900 to-violet-600', elo: 1910,
  },
  {
    id: 'deepcheck', name: 'DeepCheck', emoji: '🤖',
    tagline: 'Pure minimax, depth 7. There is no escape.',
    difficulty: 'hard', color: 'from-red-700 to-rose-500', elo: 2200,
  },
];

const tiers: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy',   label: '🟢 Beginner',     color: 'text-green-400' },
  { value: 'medium', label: '🟡 Intermediate',  color: 'text-yellow-400' },
  { value: 'hard',   label: '🔴 Expert',        color: 'text-red-400' },
];

const TIME_CONTROLS = [
  { id: 'none',     icon: '∞',   label: 'No limit',    sub: 'Untimed',    type: 'none' as const,  seconds: 0    },
  { id: 'move30',   icon: '⏰',  label: '30s / move',  sub: 'Per turn',   type: 'move' as const,  seconds: 30   },
  { id: 'move60',   icon: '⏱️', label: '1 min / move', sub: 'Per turn',  type: 'move' as const,  seconds: 60   },
  { id: 'blitz5',   icon: '⚡',  label: '5 min',        sub: 'Blitz',      type: 'game' as const,  seconds: 300  },
  { id: 'rapid15',  icon: '🔥',  label: '15 min',       sub: 'Rapid',      type: 'game' as const,  seconds: 900  },
  { id: 'classic30', icon: '♟️', label: '30 min',      sub: 'Classical',  type: 'game' as const,  seconds: 1800 },
];

type Step = 'mode' | 'bots' | 'online' | 'pregame';

export default function ModeSelector({ onSelect, onStepChange, rulesVariant = 'american', onVariantChange }: ModeSelectorProps) {
  const [step, setStep] = useState<Step>('mode');
  const [pendingMode, setPendingMode] = useState<GameMode>('ai');
  const [pendingBot, setPendingBot] = useState<BotCharacter | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [timeControlId, setTimeControlId] = useState('move30');
  const [moveExpiry, setMoveExpiry] = useState<'random' | 'lose'>('random');
  const [localVariant, setLocalVariant] = useState<RulesVariant>(rulesVariant);

  const changeStep = (s: Step) => { setStep(s); onStepChange?.(s); };

  const handleVariant = (v: RulesVariant) => {
    setLocalVariant(v);
    onVariantChange?.(v);
  };

  const buildTimeControl = (): TimeControl => {
    const tc = TIME_CONTROLS.find(t => t.id === timeControlId)!;
    if (tc.type === 'none') return { type: 'none' };
    if (tc.type === 'move') return { type: 'move', seconds: tc.seconds, expiry: moveExpiry };
    return { type: 'game', seconds: tc.seconds };
  };

  const handleStart = () => {
    const tc = buildTimeControl();
    if (pendingMode === 'local') {
      onSelect('local', undefined, undefined, undefined, undefined, tc, localVariant);
    } else if (pendingBot) {
      onSelect(pendingMode, pendingBot.difficulty, undefined, pendingBot.name, pendingBot.elo, tc, localVariant);
    }
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  };
  const handleCreateRoom = () => onSelect('online', undefined, generateRoomCode());
  const handleJoinRoom = () => { if (joinCode.length === 6) onSelect('online', undefined, joinCode.toUpperCase()); };

  const handleBack = () => {
    if (step === 'pregame') changeStep(pendingBot ? 'bots' : 'mode');
    else changeStep('mode');
  };

  const modes = [
    { mode: 'ai' as GameMode,      icon: <Bot size={28} />,     title: 'vs Bots',      desc: 'Challenge 22 unique bots — from beginners to legends', color: 'from-purple-600 to-blue-600',   badge: 'Single Player' },
    { mode: 'local' as GameMode,   icon: <Users size={28} />,   title: 'Local 2P',     desc: 'Play with a friend on the same screen',                color: 'from-amber-600 to-orange-600',  badge: 'Same Device'   },
    { mode: 'online' as GameMode,  icon: <Globe size={28} />,   title: 'Online',       desc: 'Play with anyone, anywhere via room code',             color: 'from-green-600 to-teal-600',    badge: 'Multiplayer'   },
    { mode: 'mines' as GameMode,   icon: <Zap size={28} />,     title: 'Mines Mode',   desc: 'Hidden mines detonate when landed on.',                color: 'from-orange-600 to-red-600',    badge: 'Chaos'         },
    { mode: 'roulette' as GameMode, icon: <Shuffle size={28} />, title: 'Roulette',    desc: 'Spin the wheel each turn. Extra move, skip, or normal?', color: 'from-purple-600 to-pink-600', badge: 'Luck'          },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── Mode selection ── */}
        {step === 'mode' && (
          <motion.div key="mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Game Mode</h2>
              <p className="text-gray-400">How do you want to play?</p>
            </div>
            {modes.map(({ mode, icon, title, desc, color, badge }) => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (mode === 'ai' || mode === 'mines' || mode === 'roulette') { setPendingMode(mode); changeStep('bots'); }
                  else if (mode === 'online') changeStep('online');
                  else { setPendingMode('local'); setPendingBot(null); changeStep('pregame'); }
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group text-left"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white flex-shrink-0`}>{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-lg">{title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">{badge}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
                <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ── Bot selection ── */}
        {step === 'bots' && (
          <motion.div key="bots" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-white mb-1">Pick Your Opponent</h2>
              <p className="text-gray-400 text-sm">22 characters · 3 skill tiers</p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5 scrollbar-thin">
              {tiers.map(tier => (
                <div key={tier.value}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 px-1 ${tier.color}`}>{tier.label}</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {bots.filter(b => b.difficulty === tier.value).map((bot, i) => (
                      <motion.button
                        key={bot.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setPendingBot(bot); changeStep('pregame'); }}
                        className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all"
                      >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bot.color} flex items-center justify-center text-3xl mb-2 shadow-lg`}>{bot.emoji}</div>
                        <span className="text-white text-xs font-bold leading-tight mb-1">{bot.name}</span>
                        <span className="text-gray-500 text-[10px] leading-snug italic mb-2 line-clamp-2">{bot.tagline}</span>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          tier.value === 'easy' ? 'bg-green-500/15 text-green-400' :
                          tier.value === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>{bot.elo} ELO</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleBack} className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors mt-4">← Back</button>
          </motion.div>
        )}

        {/* ── Online setup ── */}
        {step === 'online' && (
          <motion.div key="online" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Online Multiplayer</h2>
              <p className="text-gray-400">Create or join a room</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Wifi size={16} className="text-green-400" />Create New Room</h3>
              <p className="text-gray-400 text-sm mb-4">Share the code with your friend to play together</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateRoom} className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all">Create Room</motion.button>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-white mb-2">Join Existing Room</h3>
              <p className="text-gray-400 text-sm mb-4">Enter the 6-character room code</p>
              <div className="flex gap-2">
                <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="ABC123" className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 font-mono text-lg tracking-widest focus:outline-none focus:border-amber-400" />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleJoinRoom} disabled={joinCode.length !== 6} className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl disabled:opacity-40 transition-all">Join</motion.button>
              </div>
            </div>
            <button onClick={handleBack} className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors">← Back</button>
          </motion.div>
        )}

        {/* ── Pre-game settings ── */}
        {step === 'pregame' && (
          <motion.div key="pregame" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">Game Setup</h2>
              <p className="text-gray-400 text-sm">Configure before you play</p>
            </div>

            {/* Opponent card */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              {pendingBot ? (
                <>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pendingBot.color} flex items-center justify-center text-2xl flex-shrink-0`}>{pendingBot.emoji}</div>
                  <div className="min-w-0">
                    <div className="font-bold text-white">{pendingBot.name}</div>
                    <div className="text-xs text-gray-400">
                      {pendingBot.difficulty === 'easy' ? '🟢 Beginner' : pendingBot.difficulty === 'medium' ? '🟡 Intermediate' : '🔴 Expert'} · {pendingBot.elo} ELO
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-2xl flex-shrink-0">👥</div>
                  <div>
                    <div className="font-bold text-white">Local 2 Players</div>
                    <div className="text-xs text-gray-400">Same screen · Take turns</div>
                  </div>
                </>
              )}
              <button onClick={handleBack} className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">Change</button>
            </div>

            {/* Rules variant */}
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Rules</div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'american' as RulesVariant, flag: '🇺🇸', label: 'American', desc: 'Kings move 1 square. Capture forward only.' },
                  { value: 'russian'  as RulesVariant, flag: '🇷🇺', label: 'Russian',  desc: 'Flying kings. Capture any direction.' },
                ] ).map(v => (
                  <button
                    key={v.value}
                    onClick={() => handleVariant(v.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      localVariant === v.value
                        ? v.value === 'american' ? 'border-amber-500 bg-amber-500/15' : 'border-blue-500 bg-blue-500/15'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`font-semibold text-sm mb-0.5 ${localVariant === v.value ? (v.value === 'american' ? 'text-amber-400' : 'text-blue-400') : 'text-white'}`}>
                      {v.flag} {v.label}
                    </div>
                    <div className="text-[11px] text-gray-500">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time control */}
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Time Control</div>
              <div className="grid grid-cols-3 gap-2">
                {TIME_CONTROLS.map(tc => (
                  <button
                    key={tc.id}
                    onClick={() => setTimeControlId(tc.id)}
                    className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all ${
                      timeControlId === tc.id
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-xl mb-1">{tc.icon}</span>
                    <span className="text-xs font-bold">{tc.label}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{tc.sub}</span>
                  </button>
                ))}
              </div>

              {/* Move expiry toggle — only when a per-move timer is selected */}
              <AnimatePresence>
                {TIME_CONTROLS.find(t => t.id === timeControlId)?.type === 'move' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3">
                      <div className="text-[11px] text-gray-500 mb-1.5">When the time runs out…</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setMoveExpiry('random')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            moveExpiry === 'random' ? 'border-amber-500 bg-amber-500/15 text-amber-400' : 'border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          🎲 Random move
                        </button>
                        <button
                          onClick={() => setMoveExpiry('lose')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            moveExpiry === 'lose' ? 'border-red-500 bg-red-500/15 text-red-400' : 'border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          💀 Lose the game
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Start button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-2xl text-lg transition-all shadow-lg"
            >
              Start Game →
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
