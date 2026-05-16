'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ChevronRight, Wifi } from 'lucide-react';
import type { Difficulty } from '@/lib/ai';

export type GameMode = 'ai' | 'local' | 'online';

interface ModeSelectorProps {
  onSelect: (mode: GameMode, difficulty?: Difficulty, roomCode?: string) => void;
}

const difficulties: { value: Difficulty; label: string; desc: string; color: string }[] = [
  { value: 'easy', label: 'Easy', desc: 'Random moves, great for beginners', color: 'from-green-600 to-green-700' },
  { value: 'medium', label: 'Medium', desc: 'Minimax depth 4, a worthy opponent', color: 'from-yellow-600 to-yellow-700' },
  { value: 'hard', label: 'Hard', desc: 'Full alpha-beta depth 7, ruthless', color: 'from-red-600 to-red-700' },
];

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [step, setStep] = useState<'mode' | 'difficulty' | 'online'>('mode');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    onSelect('online', undefined, code);
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
      title: 'vs AI',
      desc: 'Challenge our Minimax engine at 3 difficulty levels',
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
                  if (mode === 'ai') setStep('difficulty');
                  else if (mode === 'online') setStep('online');
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

        {step === 'difficulty' && (
          <motion.div
            key="difficulty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Difficulty</h2>
              <p className="text-gray-400">How hard should the AI play?</p>
            </div>

            {difficulties.map(({ value, label, desc, color }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('ai', value)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group text-left"
              >
                <div className={`px-4 py-2 rounded-xl bg-gradient-to-br ${color} text-white font-bold text-sm flex-shrink-0`}>
                  {label}
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">{desc}</p>
                </div>
                <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
              </motion.button>
            ))}

            <button
              onClick={() => setStep('mode')}
              className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
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
