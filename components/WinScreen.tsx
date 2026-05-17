'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, AnalysisNote } from '@/lib/game-logic';
import { Trophy, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Info, XCircle } from 'lucide-react';

interface WinScreenProps {
  winner: 'red' | 'black' | 'draw';
  playerColor?: Player;
  onRestart: () => void;
  onMenu: () => void;
  analysisNotes?: AnalysisNote[];
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

export default function WinScreen({
  winner,
  playerColor,
  onRestart,
  onMenu,
  analysisNotes = [],
}: WinScreenProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
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

        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-4xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-400">{subtitle}</p>
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

          {/* AI Analysis */}
          {analysisNotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-4 border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-white flex items-center gap-2">
                  🧠 AI Coach Analysis
                </span>
                {showAnalysis ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              <AnimatePresence>
                {showAnalysis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                      {analysisNotes.slice(0, 8).map((note, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          {severityIcon[note.severity]}
                          <span>{note.message}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
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
              className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10"
            >
              Main Menu
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
