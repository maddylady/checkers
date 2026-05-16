'use client';

import { motion } from 'framer-motion';
import type { GameState, Player } from '@/lib/game-logic';
import type { Difficulty } from '@/lib/ai';
import { RotateCcw, Flag, Clock, Zap } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  mode: 'ai' | 'local' | 'online';
  aiDifficulty?: Difficulty;
  onRestart: () => void;
  onResign: () => void;
  playerColor?: Player;
  turnTimer?: number;
  opponentName?: string;
  thinking?: boolean;
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export default function GameControls({
  gameState,
  mode,
  aiDifficulty,
  onRestart,
  onResign,
  playerColor,
  turnTimer,
  opponentName,
  thinking,
}: GameControlsProps) {
  const { currentPlayer, captured, status, moveHistory } = gameState;
  const isPlaying = status === 'playing';

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {/* Turn indicator */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Current Turn</div>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ repeat: isPlaying ? Infinity : 0, duration: 1.5 }}
            className={`w-8 h-8 rounded-full border-2 shadow-lg ${
              currentPlayer === 'red'
                ? 'bg-gradient-to-br from-red-400 to-red-700 border-red-300 shadow-red-500/40'
                : 'bg-gradient-to-br from-gray-600 to-gray-900 border-gray-400 shadow-gray-500/40'
            }`}
          />
          <div>
            <div className="font-bold text-white capitalize">
              {currentPlayer === playerColor
                ? 'Your turn'
                : mode === 'ai' && thinking
                ? 'AI thinking...'
                : `${currentPlayer === 'red' ? 'Red' : 'Black'}'s turn`}
            </div>
            {mode === 'ai' && aiDifficulty && (
              <div className={`text-xs ${difficultyColors[aiDifficulty]} capitalize`}>
                AI: {aiDifficulty} difficulty
              </div>
            )}
          </div>
        </div>

        {/* Turn timer */}
        {turnTimer !== undefined && isPlaying && (
          <div className="mt-3 flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <div className="flex-1 bg-white/10 rounded-full h-2">
              <motion.div
                className={`h-full rounded-full transition-colors ${
                  turnTimer > 15 ? 'bg-green-400' : turnTimer > 5 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${(turnTimer / 30) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-300 tabular-nums w-6">{turnTimer}s</span>
          </div>
        )}

        {thinking && (
          <div className="mt-2 flex items-center gap-2 text-purple-400 text-xs">
            <Zap size={12} className="animate-pulse" />
            Calculating best move...
          </div>
        )}
      </div>

      {/* Captured pieces */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Captured</div>
        <div className="flex justify-between">
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1 flex-wrap max-w-[80px]">
              {Array(captured.red).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-700 border border-red-300"
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">Red: {captured.red}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1 flex-wrap max-w-[80px] justify-end">
              {Array(captured.black).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-900 border border-gray-400"
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">Black: {captured.black}</span>
          </div>
        </div>
      </div>

      {/* Move count */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex justify-between items-center">
        <span className="text-xs text-gray-400">Moves played</span>
        <span className="text-white font-bold tabular-nums">{moveHistory.length}</span>
      </div>

      {/* Opponent info */}
      {opponentName && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
          <div className="text-xs text-gray-400">Playing against</div>
          <div className="text-white font-semibold mt-1">{opponentName}</div>
        </div>
      )}

      {/* Action buttons */}
      {isPlaying && (
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/10"
          >
            <RotateCcw size={14} />
            Restart
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onResign}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors border border-red-500/30"
          >
            <Flag size={14} />
            Resign
          </motion.button>
        </div>
      )}
    </div>
  );
}
