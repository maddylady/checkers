'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Player, AnalysisNote, Piece, Move } from '@/lib/game-logic';
import { Trophy, RefreshCw, Info, AlertTriangle, XCircle, Share2 } from 'lucide-react';

type BoardGrid = (Piece | null)[][];

interface WinScreenProps {
  winner: 'red' | 'black' | 'draw';
  playerColor?: Player;
  onRestart: () => void;
  onMenu: () => void;
  analysisNotes?: AnalysisNote[];
  boardHistory?: BoardGrid[];
  moveHistory?: Move[];
}

// Simple canvas-based confetti
function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; angle: number; angularVelocity: number;
    }[] = [];

    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.2,
      });
    }

    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.angle += p.angularVelocity;

        if (p.y > canvas.height) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
        ctx.restore();
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    }

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return canvasRef;
}

// Mini board for game review — 240x240px (30px per cell)
interface MiniBoardProps {
  board: BoardGrid;
  highlightFrom?: [number, number];
  highlightTo?: [number, number];
  captures?: [number, number][];
}

function MiniBoard({ board, highlightFrom, highlightTo, captures = [] }: MiniBoardProps) {
  const captureSet = new Set(captures.map(([r, c]) => `${r},${c}`));

  return (
    <div
      className="inline-grid border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
      style={{ gridTemplateColumns: 'repeat(8, 30px)', width: 240, height: 240 }}
    >
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const isDark = (row + col) % 2 === 1;
          const piece = board[row]?.[col] ?? null;
          const fromKey = highlightFrom ? `${highlightFrom[0]},${highlightFrom[1]}` : '';
          const toKey = highlightTo ? `${highlightTo[0]},${highlightTo[1]}` : '';
          const cellKey = `${row},${col}`;
          const isFrom = cellKey === fromKey;
          const isTo = cellKey === toKey;
          const isCaptured = captureSet.has(cellKey);

          let cellBg = isDark
            ? 'bg-slate-600 dark:bg-slate-700'
            : 'bg-slate-200 dark:bg-slate-400';

          if (isTo && isDark) cellBg = 'bg-amber-400/70';
          else if (isFrom && isDark) cellBg = 'bg-amber-400/50';
          else if (isCaptured && isDark) cellBg = 'bg-red-400/30';

          return (
            <div
              key={cellKey}
              className={`relative flex items-center justify-center ${cellBg}`}
              style={{ width: 30, height: 30 }}
            >
              {/* Overlay highlight for light squares */}
              {(isFrom || isTo || isCaptured) && !isDark && (
                <div
                  className={`absolute inset-0 ${
                    isTo ? 'bg-amber-400/70' : isFrom ? 'bg-amber-400/50' : 'bg-red-400/30'
                  }`}
                />
              )}
              {piece && (
                <div
                  className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold
                    ${piece.player === 'red'
                      ? 'bg-gradient-to-br from-red-400 to-red-700 border border-red-300'
                      : 'bg-gradient-to-br from-gray-500 to-gray-900 border border-gray-400'
                    }
                    ${piece.type === 'king' ? 'ring-1 ring-amber-400' : ''}
                  `}
                >
                  {piece.type === 'king' && (
                    <span className="text-amber-300 leading-none" style={{ fontSize: 8 }}>♛</span>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function WinScreen({
  winner,
  playerColor,
  onRestart,
  onMenu,
  analysisNotes = [],
  boardHistory,
  moveHistory,
}: WinScreenProps) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isWin = winner !== 'draw' && winner === playerColor;
  const isDraw = winner === 'draw';

  const confettiActive = isWin || isDraw;
  const canvasRef = useConfetti(confettiActive);

  const title = isDraw
    ? "It's a Draw!"
    : isWin
    ? 'You Win! 🎉'
    : playerColor
    ? 'You Lose...'
    : `${winner === 'red' ? 'Red' : 'Black'} Wins!`;

  const subtitle = isDraw
    ? 'Well played by both sides'
    : isWin
    ? 'Outstanding strategy!'
    : playerColor
    ? 'Better luck next time'
    : 'Excellent game!';

  const severityIcon = {
    info: <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />,
    error: <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />,
  };

  const severityCallout = {
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
  };

  const hasReview = !!(boardHistory && boardHistory.length > 0 && moveHistory && moveHistory.length > 0);

  // Current board/move for review
  const reviewBoard = hasReview && reviewIndex !== null ? boardHistory![reviewIndex] : null;
  const reviewMove = hasReview && reviewIndex !== null && reviewIndex > 0 ? moveHistory![reviewIndex - 1] : null;
  const reviewNote = hasReview && reviewIndex !== null
    ? analysisNotes.find(n => n.moveIndex === reviewIndex)
    : null;

  const handleShare = async () => {
    let text: string;
    if (isDraw) {
      text = 'Just drew on CheckMate Arena!';
    } else if (isWin) {
      text = `I just beat ${winner === 'red' ? 'Black' : 'Red'} on CheckMate Arena! 🎮 Play at checkmatearena.com`;
    } else {
      text = 'CheckMate Arena just humbled me 😅 Can you do better?';
    }

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard failed silently
      }
    }
  };

  return (
    <>
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-0 flex items-center justify-center z-40 p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Trophy */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <div className={`p-4 rounded-full ${
              isDraw
                ? 'bg-blue-500/20'
                : isWin
                ? 'bg-yellow-500/20'
                : 'bg-red-500/20'
            }`}>
              <Trophy
                size={48}
                className={
                  isDraw ? 'text-blue-400' : isWin ? 'text-yellow-400' : 'text-red-400'
                }
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
            <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
          </motion.div>

          {/* Winner indicator */}
          {!isDraw && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="flex justify-center mb-6"
            >
              <div className={`flex items-center gap-3 px-6 py-3 rounded-full border ${
                winner === 'red'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-gray-500/20 border-gray-500/40 text-gray-300'
              }`}>
                <div className={`w-5 h-5 rounded-full ${
                  winner === 'red'
                    ? 'bg-gradient-to-br from-red-400 to-red-700'
                    : 'bg-gradient-to-br from-gray-600 to-gray-900'
                }`} />
                <span className="font-semibold capitalize">{winner} player wins</span>
              </div>
            </motion.div>
          )}

          {/* Game Review */}
          {hasReview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-4"
            >
              {reviewIndex === null ? (
                <button
                  onClick={() => setReviewIndex(0)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                >
                  <span>🎬</span>
                  Review Game
                </button>
              ) : (
                <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5">
                  <div className="p-4">
                    {/* Board */}
                    <div className="flex justify-center mb-3">
                      {reviewBoard && (
                        <MiniBoard
                          board={reviewBoard}
                          highlightFrom={reviewMove?.from}
                          highlightTo={reviewMove?.to}
                          captures={reviewMove?.captures}
                        />
                      )}
                    </div>

                    {/* Move label */}
                    <div className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {reviewIndex === 0
                        ? 'Starting Position'
                        : `Move ${reviewIndex} / ${moveHistory!.length}`}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <button
                        onClick={() => setReviewIndex(0)}
                        disabled={reviewIndex === 0}
                        className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30"
                      >⏮</button>
                      <button
                        onClick={() => setReviewIndex(prev => Math.max(0, (prev ?? 0) - 1))}
                        disabled={reviewIndex === 0}
                        className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30"
                      >◀</button>
                      <button
                        onClick={() => setReviewIndex(prev => Math.min(moveHistory!.length, (prev ?? 0) + 1))}
                        disabled={reviewIndex === moveHistory!.length}
                        className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30"
                      >▶</button>
                      <button
                        onClick={() => setReviewIndex(moveHistory!.length)}
                        disabled={reviewIndex === moveHistory!.length}
                        className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30"
                      >⏭</button>
                    </div>

                    {/* Analysis note callout */}
                    {reviewNote && (
                      <div className={`flex items-start gap-2 text-sm p-3 rounded-xl border mb-3 ${severityCallout[reviewNote.severity]}`}>
                        {severityIcon[reviewNote.severity]}
                        <span>{reviewNote.message}</span>
                      </div>
                    )}

                    {/* Close button */}
                    <button
                      onClick={() => setReviewIndex(null)}
                      className="w-full py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      Close Review
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-400 hover:to-amber-500 transition-all"
            >
              <RefreshCw size={16} />
              Play Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onMenu}
              className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold transition-all border border-gray-200 dark:border-white/10"
            >
              Main Menu
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              title="Share result"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold transition-all border border-gray-200 dark:border-white/10"
            >
              <Share2 size={16} />
              {copied ? '✓ Copied!' : 'Share'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
