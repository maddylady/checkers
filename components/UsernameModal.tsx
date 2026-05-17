'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Check } from 'lucide-react';

const CITIES = [
  'Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe',
  'Taraz', 'Pavlodar', 'Semey', 'Atyrau', 'Kostanay',
  'Oral', 'Ust-Kamenogorsk', 'Bishkek', 'Tashkent',
  'Moscow', 'Dubai', 'Istanbul', 'London', 'New York',
  'Berlin', 'Paris', 'Toronto', 'Tokyo', 'Seoul',
];
import { setUsername, getCity, setCity } from '@/lib/storage';

interface UsernameModalProps {
  currentUsername: string;
  currentCity?: string;
  onSave: (name: string, city: string) => void;
  onClose: () => void;
  required?: boolean;
}

export default function UsernameModal({
  currentUsername,
  currentCity,
  onSave,
  onClose,
  required = false,
}: UsernameModalProps) {
  const [name, setName] = useState(currentUsername);
  const [city, setCityState] = useState(currentCity ?? getCity());

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCity(city);
    setUsername(trimmed);
    onSave(trimmed, city);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={required ? undefined : onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-white/10 shadow-2xl max-w-sm w-full"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-amber-500/20 rounded-2xl">
            <User size={32} className="text-amber-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {required ? 'Welcome to CheckMate Arena!' : 'Change Username'}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-6">
          {required
            ? 'Choose a username to track your stats on the leaderboard'
            : 'Update your display name'}
        </p>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          placeholder="Enter username..."
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-center text-lg mb-3"
        />

        <div className="relative mb-6">
          <select
            value={city}
            onChange={e => setCityState(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm appearance-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">No city</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
        </div>

        <div className="flex gap-3">
          {!required && (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold disabled:opacity-40 transition-all"
          >
            <Check size={16} />
            {required ? 'Let\'s Play!' : 'Save'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
