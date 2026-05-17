'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Board from './Board';
import { cloneBoard } from '@/lib/game-logic';
import type { GameState, Board as BoardGrid } from '@/lib/game-logic';
import {
  PUZZLES,
  getPuzzleProgress,
  markPuzzleSolved,
  getPuzzleCoins,
  type Puzzle,
} from '@/lib/puzzles';
import { ArrowLeft, Lightbulb, ChevronRight } from 'lucide-react';

interface DrillsPageProps {
  onExit: () => void;
  username: string;
}

type PuzzleStatus = 'idle' | 'solved' | 'failed';

export default function DrillsPage({ onExit }: DrillsPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<PuzzleStatus>('idle');
  const [moveStep, setMoveStep] = useState(0);
  const [localBoard, setLocalBoard] = useState<BoardGrid>(() => cloneBoard(PUZZLES[0].board));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [totalCoins, setTotalCoins] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Load progress from localStorage after mount
  useEffect(() => {
    setProgress(getPuzzleProgress());
    setTotalCoins(getPuzzleCoins());
  }, []);

  const puzzle: Puzzle = PUZZLES[currentIndex];

  const resetPuzzle = useCallback((idx: number, dir: 1 | -1 = 1) => {
    setDirection(dir);
    setCurrentIndex(idx);
    setLocalBoard(cloneBoard(PUZZLES[idx].board));
    setSelectedCell(null);
    setMoveStep(0);
    setStatus('idle');
    setShowHint(false);
  }, []);

  // Apply a step of the solution to localBoard
  function applyStep(board: BoardGrid, step: { from: [number, number]; to: [number, number]; captures: [number, number][] }): BoardGrid {
    const newBoard = cloneBoard(board);
    const piece = newBoard[step.from[0]][step.from[1]];
    if (!piece) return newBoard;

    newBoard[step.to[0]][step.to[1]] = { ...piece };
    newBoard[step.from[0]][step.from[1]] = null;

    for (const [r, c] of step.captures) {
      newBoard[r][c] = null;
    }

    // Promotion: red man reaches row 0
    const movedPiece = newBoard[step.to[0]][step.to[1]];
    if (movedPiece && movedPiece.type === 'regular' && movedPiece.player === 'red' && step.to[0] === 0) {
      newBoard[step.to[0]][step.to[1]] = { ...movedPiece, type: 'king' };
    }

    return newBoard;
  }

  function handleCellClick(row: number, col: number) {
    if (status !== 'idle') return;

    const cell = localBoard[row][col];

    // No piece selected yet — select a red piece
    if (!selectedCell) {
      if (cell?.player === 'red') {
        setSelectedCell([row, col]);
      }
      return;
    }

    // Same cell clicked — deselect
    if (selectedCell[0] === row && selectedCell[1] === col) {
      setSelectedCell(null);
      return;
    }

    // Clicked another red piece — switch selection
    if (cell?.player === 'red') {
      setSelectedCell([row, col]);
      return;
    }

    // Attempt a move: check if it matches solution[moveStep]
    const expectedStep = puzzle.solution[moveStep];
    if (!expectedStep) {
      setSelectedCell(null);
      return;
    }

    const fromMatches = expectedStep.from[0] === selectedCell[0] && expectedStep.from[1] === selectedCell[1];
    const toMatches = expectedStep.to[0] === row && expectedStep.to[1] === col;

    if (fromMatches && toMatches) {
      // Correct step!
      const newBoard = applyStep(localBoard, expectedStep);
      setLocalBoard(newBoard);
      setSelectedCell(null);

      const nextStep = moveStep + 1;
      if (nextStep >= puzzle.solution.length) {
        // Puzzle solved!
        setStatus('solved');
        setMoveStep(nextStep);
        markPuzzleSolved(puzzle.id, puzzle.coins);
        const newProgress = getPuzzleProgress();
        setProgress(newProgress);
        setTotalCoins(getPuzzleCoins());
      } else {
        // More steps remain — auto-select the piece at the new position for UX
        setMoveStep(nextStep);
        setSelectedCell(expectedStep.to);
      }
    } else {
      // Wrong move
      setStatus('failed');
      setSelectedCell(null);
    }
  }

  function handleReset() {
    resetPuzzle(currentIndex);
  }

  function handleNext() {
    if (currentIndex < PUZZLES.length - 1) {
      resetPuzzle(currentIndex + 1, 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      resetPuzzle(currentIndex - 1, -1);
    }
  }

  const solvedCount = Object.values(progress).filter(Boolean).length;

  // Build a fake GameState so we can reuse the Board component
  const fakeGameState: GameState = {
    board: localBoard,
    currentPlayer: puzzle.playerToMove,
    selectedCell,
    validMoves: [],
    status: 'playing',
    captured: { red: 0, black: 0 },
    moveHistory: [],
    movesWithoutCapture: 0,
    rulesVariant: 'american',
  };

  const difficultyColors: Record<Puzzle['difficulty'], string> = {
    easy: 'text-green-500 bg-green-500/10 border-green-500/30',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    hard: 'text-red-500 bg-red-500/10 border-red-500/30',
  };

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <div className="pt-16 min-h-screen flex flex-col bg-[#f0f4f8] dark:bg-[#0d0f1a]">
      <div className="max-w-5xl mx-auto p-4 w-full flex flex-col lg:flex-row gap-6">

        {/* ── Left sidebar ── */}
        <div className="lg:w-64 flex flex-col gap-4 flex-shrink-0">

          {/* Back button */}
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          {/* Puzzle info card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${difficultyColors[puzzle.difficulty]}`}>
                {puzzle.difficulty}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                +{puzzle.coins} 🪙
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{puzzle.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{puzzle.desc}</p>

            {/* Hint toggle */}
            <button
              onClick={() => setShowHint(h => !h)}
              className="mt-3 flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              <Lightbulb size={13} />
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20">
                    {puzzle.hint}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Progress
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{solvedCount}<span className="text-base font-normal text-gray-400 dark:text-gray-500"> / 10</span></span>
              <span className="text-sm text-amber-500 font-bold">{totalCoins} 🪙</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                animate={{ width: `${(solvedCount / 10) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Move indicator (multi-step) */}
          {puzzle.solution.length > 1 && status === 'idle' && (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Multi-jump
              </div>
              <div className="flex gap-2">
                {puzzle.solution.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                      i < moveStep
                        ? 'bg-green-400'
                        : i === moveStep
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Step {Math.min(moveStep + 1, puzzle.solution.length)} of {puzzle.solution.length}
              </div>
            </div>
          )}
        </div>

        {/* ── Center: board ── */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">
              Puzzle {currentIndex + 1} of {PUZZLES.length}
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{puzzle.title}</h1>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Board
                gameState={fakeGameState}
                onCellClick={handleCellClick}
                flipped={false}
                disabled={status === 'solved'}
              />
            </motion.div>
          </AnimatePresence>

          {/* Status messages */}
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-gray-500 dark:text-gray-400 text-center"
              >
                Find the best move for Red
              </motion.div>
            )}

            {status === 'solved' && (
              <motion.div
                key="solved"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 text-green-500 font-bold text-lg">
                  <span>✓</span>
                  <span>Correct! Well done!</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  +{puzzle.coins} coins earned
                </div>
                {currentIndex < PUZZLES.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-green-500/25"
                  >
                    Next Puzzle
                    <ChevronRight size={16} />
                  </button>
                )}
                {currentIndex === PUZZLES.length - 1 && (
                  <div className="text-green-500 font-semibold text-sm">
                    You&apos;ve completed all puzzles! 🎉
                  </div>
                )}
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
                  <span>✗</span>
                  <span>Wrong move. Try again.</span>
                </div>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-red-500/25"
                >
                  Reset Puzzle
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation arrows */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === PUZZLES.length - 1}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>

        {/* ── Right: puzzle navigator ── */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Puzzles
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PUZZLES.map((p, i) => {
                const isSolved = progress[p.id];
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => resetPuzzle(i, i > currentIndex ? 1 : -1)}
                    className={`
                      relative flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all
                      ${isCurrent
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : isSolved
                        ? 'border-green-500/40 bg-green-500/10 text-green-500'
                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    {isSolved && (
                      <span className="absolute top-1 right-1 text-[10px] text-green-500">✓</span>
                    )}
                    <span className="text-lg leading-none mb-0.5">
                      {p.difficulty === 'easy' ? '🟢' : p.difficulty === 'medium' ? '🟡' : '🔴'}
                    </span>
                    <span>#{i + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 space-y-1">
              {[
                { dot: '🟢', label: 'Easy' },
                { dot: '🟡', label: 'Medium' },
                { dot: '🔴', label: 'Hard' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  <span className="text-xs">{l.dot}</span>
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
