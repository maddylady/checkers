'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDailyChallenges, getDailyProgress, type Challenge, type ChallengeProgress } from '@/lib/challenges';

export default function DailyChallenges() {
  const [challenges, setChallenges] = useState<[Challenge, Challenge, Challenge] | null>(null);
  const [progress, setProgress] = useState<{ easy: ChallengeProgress; medium: ChallengeProgress; hard: ChallengeProgress } | null>(null);

  useEffect(() => {
    setChallenges(getDailyChallenges());
    const dp = getDailyProgress();
    setProgress({ easy: dp.easy, medium: dp.medium, hard: dp.hard });
  }, []);

  if (!challenges || !progress) return null;

  const diffColors = {
    easy: { bg: 'from-green-600/20 to-green-600/5', border: 'border-green-600/30', text: 'text-green-400', badge: 'bg-green-600/20 text-green-400' },
    medium: { bg: 'from-yellow-600/20 to-yellow-600/5', border: 'border-yellow-600/30', text: 'text-yellow-400', badge: 'bg-yellow-600/20 text-yellow-400' },
    hard: { bg: 'from-red-600/20 to-red-600/5', border: 'border-red-600/30', text: 'text-red-400', badge: 'bg-red-600/20 text-red-400' },
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-200 dark:border-white/10">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Daily Challenges</h3>
          <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">Resets at midnight</p>
        </div>
        <div className="text-xs text-amber-400 font-mono">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div className="p-3 space-y-2">
        {(['easy', 'medium', 'hard'] as const).map((diff, i) => {
          const c = challenges[i];
          const p = progress[diff];
          const col = diffColors[diff];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ${col.bg} ${col.border} ${p.completed ? 'opacity-60' : ''}`}
            >
              <span className="text-xl flex-shrink-0">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-900 dark:text-white font-medium leading-tight">{c.text}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${col.badge}`}>{diff}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">+{c.coins} coins</span>
                </div>
              </div>
              {p.completed ? (
                <div className="text-green-400 text-lg flex-shrink-0">✓</div>
              ) : (
                <div className="text-gray-400 dark:text-gray-600 text-lg flex-shrink-0">○</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
