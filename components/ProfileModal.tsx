'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import type { PlayerStats, GameRecord } from '@/lib/game-logic';

interface ProfileModalProps {
  stats: PlayerStats;
  history: GameRecord[];
  streak: number;
  coins?: number;
  onClose: () => void;
}

function EloSparkline({ history }: { history: GameRecord[] }) {
  const points = history
    .filter(g => g.eloAfter !== undefined)
    .slice(0, 20)
    .reverse();

  if (points.length < 2) return (
    <div className="text-xs text-gray-600 dark:text-gray-500 text-center py-4">Play more games to see your ELO trend</div>
  );

  const elos = points.map(g => g.eloAfter!);
  const min = Math.min(...elos) - 20;
  const max = Math.max(...elos) + 20;
  const range = max - min || 1;
  const w = 280;
  const h = 60;

  const pts = elos.map((e, i) => {
    const x = (i / (elos.length - 1)) * w;
    const y = h - ((e - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  const first = elos[0];
  const last = elos[elos.length - 1];
  const trending = last >= first;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-500">ELO trend (last {points.length} games)</span>
        <span className={`text-xs font-semibold flex items-center gap-1 ${trending ? 'text-green-400' : 'text-red-400'}`}>
          {trending ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trending ? '+' : ''}{last - first}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 60 }}>
        <polyline
          points={pts}
          fill="none"
          stroke={trending ? '#4ade80' : '#f87171'}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {elos.map((e, i) => {
          const x = (i / (elos.length - 1)) * w;
          const y = h - ((e - min) / range) * h;
          return <circle key={i} cx={x} cy={y} r="2.5" fill={trending ? '#4ade80' : '#f87171'} />;
        })}
      </svg>
    </div>
  );
}

const modeIcon: Record<string, string> = {
  ai: '🤖', online: '🌐', local: '👥', mines: '💣', roulette: '🎰',
};

export default function ProfileModal({ stats, history, streak, coins, onClose }: ProfileModalProps) {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10">
            <X size={20} />
          </button>

          {/* Hero */}
          <div className="bg-gradient-to-br from-purple-900/40 via-gray-900 to-amber-900/20 p-6 rounded-t-3xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                {stats.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-xl font-black text-gray-900 dark:text-white">{stats.username}</div>
                {stats.city && <div className="text-sm text-gray-600 dark:text-gray-400">📍 {stats.city}</div>}
                <div className="flex items-center gap-2 mt-1">
                  {streak > 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400">
                      🔥 {streak} day streak
                    </span>
                  )}
                  {coins !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                      🪙 {coins} coins
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-amber-400">{stats.elo}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ELO</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Wins',   value: stats.wins,        color: 'text-green-400' },
                { label: 'Losses', value: stats.losses,      color: 'text-red-400'   },
                { label: 'Draws',  value: stats.draws,       color: 'text-blue-400'  },
                { label: 'Total',  value: stats.gamesPlayed, color: 'text-gray-300'  },
              ].map(s => (
                <div key={s.label} className="text-center p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-500 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Win rate bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>Win rate</span>
                <span className={`font-semibold ${winRate >= 60 ? 'text-green-400' : winRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {winRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${winRate}%` }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className={`h-2 rounded-full ${winRate >= 60 ? 'bg-green-500' : winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                />
              </div>
            </div>

            {/* ELO trend */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} className="text-amber-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Rating History</span>
              </div>
              <EloSparkline history={history} />
            </div>

            {/* Game history */}
            {history.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent Games</div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {history.slice(0, 15).map(g => {
                    const rc = g.result === 'win'
                      ? 'text-green-400 bg-green-400/10'
                      : g.result === 'loss'
                      ? 'text-red-400 bg-red-400/10'
                      : 'text-blue-400 bg-blue-400/10';
                    const icon = modeIcon[g.mode] ?? '🎮';
                    const mins = Math.floor(g.duration / 60);
                    const secs = g.duration % 60;
                    const dur = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                    const date = new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const eloDelta = g.eloAfter
                      ? history.indexOf(g) < history.length - 1
                        ? g.eloAfter - (history[history.indexOf(g) + 1]?.eloAfter ?? 1200)
                        : null
                      : null;

                    return (
                      <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg uppercase min-w-[18px] text-center ${rc}`}>
                          {g.result[0].toUpperCase()}
                        </span>
                        <span className="text-xs">{icon}</span>
                        <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">vs {g.opponent}</span>
                        {eloDelta !== null && (
                          <span className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {eloDelta >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {eloDelta >= 0 ? '+' : ''}{eloDelta}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 dark:text-gray-600">{dur}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-600">{date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {history.length === 0 && (
              <div className="text-center py-6 text-gray-600 dark:text-gray-500">
                <div className="text-3xl mb-2">🎮</div>
                Play your first game to start tracking your progress!
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
