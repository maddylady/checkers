'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ChevronRight, Wifi, Zap, Shuffle } from 'lucide-react';
import type { Difficulty } from '@/lib/ai';

export type GameMode = 'ai' | 'local' | 'online' | 'mines' | 'roulette';

interface ModeSelectorProps {
  onSelect: (mode: GameMode, difficulty?: Difficulty, roomCode?: string, botName?: string, botElo?: number) => void;
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

  // ── Expert ────────────────────────────────────────────────────────────────
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

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [step, setStep] = useState<'mode' | 'bots' | 'online'>('mode');
  const [pendingMode, setPendingMode] = useState<GameMode>('ai');
  const [joinCode, setJoinCode] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateRoom = () => onSelect('online', undefined, generateRoomCode());
  const handleJoinRoom = () => {
    if (joinCode.length === 6) onSelect('online', undefined, joinCode.toUpperCase());
  };

  const modes = [
    {
      mode: 'ai' as GameMode,
      icon: <Bot size={28} />,
      title: 'vs Bots',
      desc: 'Challenge 17 unique bots — from beginners to legendary figures',
      color: 'from-purple-600 to-blue-600',
      badge: 'Single Player',
    },
    {
      mode: 'local' as GameMode,
      icon: <Users size={28} />,
      title: 'Local 2P',
      desc: 'Play with a friend on the same screen',
      color: 'from-amber-600 to-orange-600',
      badge: 'Same Device',
    },
    {
      mode: 'online' as GameMode,
      icon: <Globe size={28} />,
      title: 'Online',
      desc: 'Play with anyone, anywhere via room code',
      color: 'from-green-600 to-teal-600',
      badge: 'Multiplayer',
    },
    {
      mode: 'mines' as GameMode,
      icon: <Zap size={28} />,
      title: 'Mines Mode',
      desc: 'Hidden mines detonate when landed on. Every game is a surprise.',
      color: 'from-orange-600 to-red-600',
      badge: 'Chaos',
    },
    {
      mode: 'roulette' as GameMode,
      icon: <Shuffle size={28} />,
      title: 'Roulette Mode',
      desc: 'Spin the wheel each turn. Extra move, skip, or normal?',
      color: 'from-purple-600 to-pink-600',
      badge: 'Luck',
    },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'mode' && (
          <motion.div
            key="mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
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
                  if (mode === 'ai' || mode === 'mines' || mode === 'roulette') {
                    setPendingMode(mode);
                    setStep('bots');
                  } else if (mode === 'online') setStep('online');
                  else onSelect('local');
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group text-left"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white flex-shrink-0`}>
                  {icon}
                </div>
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

        {step === 'bots' && (
          <motion.div
            key="bots"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-white mb-1">Pick Your Opponent</h2>
              <p className="text-gray-400 text-sm">17 characters · 3 skill tiers</p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5 scrollbar-thin">
              {tiers.map(tier => (
                <div key={tier.value}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 px-1 ${tier.color}`}>
                    {tier.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {bots.filter(b => b.difficulty === tier.value).map((bot, i) => (
                      <motion.button
                        key={bot.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(pendingMode, bot.difficulty, undefined, bot.name, bot.elo)}
                        className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all group"
                      >
                        {/* Avatar */}
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bot.color} flex items-center justify-center text-3xl mb-2 shadow-lg`}>
                          {bot.emoji}
                        </div>

                        {/* Name */}
                        <span className="text-white text-xs font-bold leading-tight mb-1">{bot.name}</span>

                        {/* Tagline */}
                        <span className="text-gray-500 text-[10px] leading-snug italic mb-2 line-clamp-2">{bot.tagline}</span>

                        {/* ELO badge */}
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          tier.value === 'easy'   ? 'bg-green-500/15 text-green-400' :
                          tier.value === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                                                    'bg-red-500/15 text-red-400'
                        }`}>
                          {bot.elo} ELO
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('mode')}
              className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors mt-4"
            >
              ← Back
            </button>
          </motion.div>
        )}

        {step === 'online' && (
          <motion.div
            key="online"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Online Multiplayer</h2>
              <p className="text-gray-400">Create or join a room</p>
            </div>

            {/* Create room */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Wifi size={16} className="text-green-400" />
                Create New Room
              </h3>
              <p className="text-gray-400 text-sm mb-4">Share the code with your friend to play together</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all"
              >
                Create Room
              </motion.button>
            </div>

            {/* Join room */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-white mb-2">Join Existing Room</h3>
              <p className="text-gray-400 text-sm mb-4">Enter the 6-character room code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ABC123"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 font-mono text-lg tracking-widest focus:outline-none focus:border-amber-400"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 6}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl disabled:opacity-40 transition-all"
                >
                  Join
                </motion.button>
              </div>
            </div>

            <button
              onClick={() => setStep('mode')}
              className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
