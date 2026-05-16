'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PlayerStats } from '@/lib/game-logic';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
  entries: PlayerStats[];
  currentUsername?: string;
  theme?: 'dark' | 'light';
}

const medals = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries, currentUsername, theme = 'dark' }: LeaderboardProps) {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const dk = theme === 'dark';

  const cities = ['All', ...Array.from(new Set(entries.map(e => e.city).filter(Boolean) as string[])).sort()];

  const filtered = cityFilter === 'All'
    ? entries
    : entries.filter(e => e.city === cityFilter);

  const top = filtered.slice(0, 8);

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      dk ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-md'
    }`}>
      <div className={`p-4 border-b flex items-center gap-2 ${dk ? 'border-white/10' : 'border-gray-100'}`}>
        <Trophy size={16} className="text-amber-400" />
        <h3 className={`font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Top Players</h3>
      </div>

      {/* City filter */}
      {cities.length > 1 && (
        <div className={`px-4 py-2 border-b flex gap-1.5 flex-wrap ${dk ? 'border-white/10' : 'border-gray-100'}`}>
          {cities.map(c => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                cityFilter === c
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : dk
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className={`divide-y ${dk ? 'divide-white/5' : 'divide-gray-100'}`}>
        {top.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            {cityFilter === 'All' ? 'No players yet — be the first!' : `No players from ${cityFilter} yet`}
          </div>
        )}
        {top.map((player, i) => {
          const isMe = player.username === currentUsername;
          const winRate = player.gamesPlayed > 0
            ? Math.round((player.wins / player.gamesPlayed) * 100)
            : 0;

          return (
            <motion.div
              key={player.username}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isMe
                  ? 'bg-amber-500/10'
                  : dk ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-6 text-center flex-shrink-0">
                {i < 3 ? (
                  <span className="text-base">{medals[i]}</span>
                ) : (
                  <span className={`text-sm font-mono ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}</span>
                )}
              </div>

              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isMe
                  ? 'bg-gradient-to-br from-amber-400 to-red-500 text-white'
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
              }`}>
                {player.username[0]?.toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isMe ? 'text-amber-500' : dk ? 'text-white' : 'text-gray-900'}`}>
                  {player.username}
                  {isMe && <span className="ml-1 text-xs text-amber-400">(you)</span>}
                </div>
                <div className={`text-xs ${dk ? 'text-gray-500' : 'text-gray-400'}`}>
                  {player.city && <span className={dk ? 'text-gray-400' : 'text-gray-500'}>{player.city} · </span>}
                  {player.wins}W {player.losses}L {player.draws}D
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <div className={`text-sm font-bold ${
                  winRate >= 60 ? 'text-green-500' :
                  winRate >= 40 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {winRate}%
                </div>
                <div className={`text-xs ${dk ? 'text-gray-500' : 'text-gray-400'}`}>win rate</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
