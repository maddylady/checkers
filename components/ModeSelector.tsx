'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ChevronRight, Wifi, Zap, Shuffle } from 'lucide-react';
import type { Difficulty } from '@/lib/ai';

export type GameMode = 'ai' | 'local' | 'online' | 'mines' | 'roulette';

interface ModeSelectorProps {
  onSelect: (mode: GameMode, difficulty?: Difficulty, roomCode?: string, botName?: string) => void;
}

interface BotCharacter {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  difficulty: Difficulty;
  color: string;
}

const bots: BotCharacter[] = [
  { id: 'grandma', name: 'Grandma Rose', emoji: '👵', tagline: 'Bakes cookies, plays slow', difficulty: 'easy', color: 'from-pink-600 to-rose-500' },
  { id: 'baby', name: 'Baby Bot', emoji: '🐣', tagline: 'Just hatched, learning fast', difficulty: 'easy', color: 'from-yellow-500 to-amber-400' },
  { id: 'lucky', name: 'Lucky Larry', emoji: '🎲', tagline: 'Random but surprisingly fun', difficulty: 'easy', color: 'from-teal-600 to-cyan-500' },
  { id: 'detective', name: 'Detective Dan', emoji: '🕵️', tagline: 'Investigates every move', difficulty: 'medium', color: 'from-blue-600 to-indigo-500' },
  { id: 'bookworm', name: 'The Bookworm', emoji: '📚', tagline: 'Studied all the openings', difficulty: 'medium', color: 'from-violet-600 to-purple-500' },
  { id: 'wolf', name: 'Wall St. Wolf', emoji: '🦈', tagline: 'Calculates risk like markets', difficulty: 'medium', color: 'from-slate-600 to-gray-500' },
  { id: 'deepcheck', name: 'DeepCheck', emoji: '🤖', tagline: 'Minimax at full depth', difficulty: 'hard', color: 'from-red-700 to-red-500' },
  { id: 'magnus', name: 'Magnus Jr.', emoji: '♟️', tagline: 'Born to dominate the board', difficulty: 'hard', color: 'from-orange-700 to-amber-600' },
  { id: 'oracle', name: 'The Oracle', emoji: '👁️', tagline: 'Sees your future. It is bleak.', difficulty: 'hard', color: 'from-purple-800 to-violet-600' },
];

const tierLabel: Record<Difficulty, string> = {
  easy: '🟢 Beginner',
  medium: '🟡 Intermediate',
  hard: '🔴 Expert',
};

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [step, setStep] = useState<'mode' | 'bots' | 'online'>('mode');
  const [pendingMode, setPendingMode] = useState<GameMode>('ai');
  const [joinCode, setJoinCode] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateRoom = () => {
    onSelect('online', undefined, generateRoomCode());
  };

  const handleJoinRoom = () => {
    if (joinCode.length === 6) {
      onSelect('online', undefined, joinCode.toUpperCase());
    }
  };

  const modes = [
    {
      mode: 'ai' as GameMode,
      icon: <Bot size={28} />,
      title: 'vs Bots',
      desc: 'Challenge one of 9 unique bot characters across 3 skill tiers',
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
                whileHover={{ scale: 1.02, x: 4 }}
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Pick Your Opponent</h2>
              <p className="text-gray-400">9 bots, 3 skill tiers — choose your challenge</p>
            </div>

            {(['easy', 'medium', 'hard'] as Difficulty[]).map(tier => (
              <div key={tier} className="mb-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">
                  {tierLabel[tier]}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {bots.filter(b => b.difficulty === tier).map((bot, i) => (
                    <motion.button
                      key={bot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onSelect(pendingMode, bot.difficulty, undefined, bot.name)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all text-center group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bot.color} flex items-center justify-center text-2xl shadow-lg`}>
                        {bot.emoji}
                      </div>
                      <span className="text-white text-xs font-bold leading-tight">{bot.name}</span>
                      <span className="text-gray-500 text-[10px] leading-tight">{bot.tagline}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => setStep('mode')}
              className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors mt-2"
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
