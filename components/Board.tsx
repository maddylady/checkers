'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/game-logic';
import { getMovesForCell } from '@/lib/game-logic';
import PieceComponent from './Piece';

interface BoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  flipped?: boolean;
  disabled?: boolean;
  triggeredMines?: Set<string>;
  showAllMines?: Set<string>;
}

export default function Board({ gameState, onCellClick, flipped = false, disabled = false, triggeredMines, showAllMines }: BoardProps) {
  const { board, selectedCell, validMoves, moveHistory } = gameState;

  const selectedMoves = selectedCell
    ? getMovesForCell(validMoves, selectedCell[0], selectedCell[1])
    : [];

  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
  const lastMoveSquares = lastMove
    ? new Set([`${lastMove.from[0]},${lastMove.from[1]}`, `${lastMove.to[0]},${lastMove.to[1]}`])
    : new Set<string>();

  const validTargets = new Set(selectedMoves.map(m => `${m.to[0]},${m.to[1]}`));
  const selectableCells = new Set(validMoves.map(m => `${m.from[0]},${m.from[1]}`));

  const rows = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const cols = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

  return (
    <div className="relative select-none">
      {/* Board shadow/glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-700/20 blur-xl -z-10 scale-105" />

      {/* Column labels */}
      <div className="flex mb-1 pl-8">
        {cols.map(col => (
          <div key={col} className="flex-1 text-center text-xs text-gray-400 font-mono">
            {String.fromCharCode(65 + col)}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Row labels */}
        <div className="flex flex-col pr-2">
          {rows.map(row => (
            <div key={row} className="flex-1 flex items-center justify-center text-xs text-gray-400 font-mono" style={{ height: '64px' }}>
              {8 - row}
            </div>
          ))}
        </div>

        {/* The board */}
        <div
          className="grid grid-cols-8 rounded-xl overflow-hidden border-2 border-amber-800/60"
          style={{ width: 'min(512px, calc(100vw - 120px))', height: 'min(512px, calc(100vw - 120px))' }}
        >
          {rows.map(row =>
            cols.map(col => {
              const isDark = (row + col) % 2 === 1;
              const piece = board[row][col];
              const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
              const isLastMove = lastMoveSquares.has(`${row},${col}`);
              const isLastMoveTo = lastMove && lastMove.to[0] === row && lastMove.to[1] === col;
              const isValidTarget = validTargets.has(`${row},${col}`);
              const isSelectable = selectableCells.has(`${row},${col}`) && !disabled;
              const key = `${row}-${col}`;

              return (
                <div
                  key={key}
                  className={`
                    relative flex items-center justify-center cursor-pointer
                    transition-all duration-150
                    ${isDark
                      ? 'bg-amber-900'
                      : 'bg-amber-100'
                    }
                    ${isSelected
                      ? 'ring-4 ring-inset ring-yellow-400'
                      : ''
                    }
                    ${isSelectable && !isSelected && !disabled
                      ? 'hover:brightness-110'
                      : ''
                    }
                  `}
                  onClick={() => !disabled && onCellClick(row, col)}
                  style={{ aspectRatio: '1' }}
                >
                  {/* Valid target indicator */}
                  {isValidTarget && isDark && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`absolute rounded-full z-10 pointer-events-none ${
                        piece
                          ? 'inset-0 ring-4 ring-inset ring-green-400 rounded-none'
                          : 'w-4 h-4 bg-green-400/70'
                      }`}
                    />
                  )}

                  {/* Selectable indicator */}
                  {isSelectable && !isSelected && !disabled && (
                    <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none" />
                  )}

                  {/* Last move highlight */}
                  {isLastMove && isDark && !isSelected && (
                    <>
                      {/* Background tint */}
                      <motion.div
                        key={`lastmove-${row}-${col}-${moveHistory.length}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className={`absolute inset-0 pointer-events-none ${
                          isLastMoveTo ? 'bg-cyan-400/25' : 'bg-cyan-400/10'
                        }`}
                      />
                      {/* Corner brackets */}
                      {(['tl','tr','bl','br'] as const).map(corner => (
                        <motion.div
                          key={`${corner}-${moveHistory.length}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: isLastMoveTo ? 1 : 0.5, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.05 }}
                          className={`absolute w-2.5 h-2.5 pointer-events-none ${
                            corner === 'tl' ? 'top-1 left-1 border-t-2 border-l-2' :
                            corner === 'tr' ? 'top-1 right-1 border-t-2 border-r-2' :
                            corner === 'bl' ? 'bottom-1 left-1 border-b-2 border-l-2' :
                                              'bottom-1 right-1 border-b-2 border-r-2'
                          } ${isLastMoveTo ? 'border-cyan-300' : 'border-cyan-400/50'}`}
                        />
                      ))}
                    </>
                  )}

                  {/* Mine indicator */}
                  {(triggeredMines?.has(`${row},${col}`) || showAllMines?.has(`${row},${col}`)) && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl select-none"
                      >
                        {triggeredMines?.has(`${row},${col}`) ? '💥' : '💣'}
                      </motion.div>
                    </div>
                  )}

                  {/* Piece */}
                  {piece && (
                    <PieceComponent
                      piece={piece}
                      isSelected={isSelected}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
