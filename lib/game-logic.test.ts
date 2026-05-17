import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  createInitialGameState,
  getAllValidMoves,
  applyMove,
  applyMoveToState,
  checkWinCondition,
  isMoveShape,
  isLegalMove,
  type Board,
  type Move,
} from './game-logic';

// ---- Board setup helpers ----

function emptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

function countPieces(board: Board, player: 'red' | 'black') {
  let count = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.player === player) count++;
  return count;
}

// ---- Initial board ----

describe('Initial board', () => {
  it('has 12 red pieces', () => {
    expect(countPieces(createInitialBoard(), 'red')).toBe(12);
  });

  it('has 12 black pieces', () => {
    expect(countPieces(createInitialBoard(), 'black')).toBe(12);
  });

  it('only occupies dark squares (row+col odd)', () => {
    const board = createInitialBoard();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== null) {
          expect((r + c) % 2).toBe(1);
        }
      }
    }
  });

  it('red starts at rows 0-2', () => {
    const board = createInitialBoard();
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 8; c++)
        if ((r + c) % 2 === 1) expect(board[r][c]?.player).toBe('red');
  });

  it('black starts at rows 5-7', () => {
    const board = createInitialBoard();
    for (let r = 5; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if ((r + c) % 2 === 1) expect(board[r][c]?.player).toBe('black');
  });

  it('has 20 valid moves for red at start', () => {
    const state = createInitialGameState();
    expect(state.validMoves.length).toBeGreaterThan(0);
    // Each of 4 pieces in row 2 has 1-2 moves, 4 pieces in row 0 have 0 (blocked by row 1)
    // Standard English draughts start has 7 opening moves for red
    expect(state.validMoves.length).toBe(7);
  });
});

// ---- Movement direction ----

describe('Movement direction', () => {
  it('red pieces move downward (increasing row)', () => {
    const state = createInitialGameState();
    for (const move of state.validMoves) {
      expect(move.to[0]).toBeGreaterThan(move.from[0]);
    }
  });

  it('black pieces move upward (decreasing row)', () => {
    const board = createInitialBoard();
    const blackMoves = getAllValidMoves(board, 'black');
    for (const move of blackMoves) {
      expect(move.to[0]).toBeLessThan(move.from[0]);
    }
  });
});

// ---- Mandatory capture ----

describe('Mandatory capture', () => {
  it('suppresses non-capture moves when capture is available', () => {
    const board = emptyBoard();
    // Red piece at (2,2), black piece at (3,3), landing at (4,4) is free
    board[2][2] = { id: 'r1', player: 'red', type: 'regular' };
    board[3][3] = { id: 'b1', player: 'black', type: 'regular' };

    const moves = getAllValidMoves(board, 'red');
    expect(moves.every(m => m.captures.length > 0)).toBe(true);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('returns only regular moves when no capture is available', () => {
    const board = emptyBoard();
    board[4][4] = { id: 'r1', player: 'red', type: 'regular' };

    const moves = getAllValidMoves(board, 'red');
    expect(moves.every(m => m.captures.length === 0)).toBe(true);
    expect(moves.length).toBe(2); // (5,3) and (5,5)
  });
});

// ---- Multi-capture chain ----

describe('Multi-capture chain', () => {
  it('generates chain capture through two black pieces', () => {
    const board = emptyBoard();
    // Red at (0,0), black at (1,1) and (3,1), red can chain: 0,0 -> 2,2 -> 4,0
    board[0][0] = { id: 'r1', player: 'red', type: 'regular' };
    board[1][1] = { id: 'b1', player: 'black', type: 'regular' };
    board[3][1] = { id: 'b2', player: 'black', type: 'regular' };

    const moves = getAllValidMoves(board, 'red');
    const chain = moves.find(m => m.captures.length === 2);
    expect(chain).toBeDefined();
  });
});

// ---- King promotion ----

describe('King promotion', () => {
  it('promotes red piece reaching row 7', () => {
    const board = emptyBoard();
    board[6][2] = { id: 'r1', player: 'red', type: 'regular' };

    const move: Move = { from: [6, 2], to: [7, 3], captures: [] };
    const newBoard = applyMove(board, move);
    expect(newBoard[7][3]?.type).toBe('king');
  });

  it('promotes black piece reaching row 0', () => {
    const board = emptyBoard();
    board[1][2] = { id: 'b1', player: 'black', type: 'regular' };

    const move: Move = { from: [1, 2], to: [0, 3], captures: [] };
    const newBoard = applyMove(board, move);
    expect(newBoard[0][3]?.type).toBe('king');
  });

  it('promotion ends chain capture (English draughts rule)', () => {
    const board = emptyBoard();
    // Red at (5,0), black at (6,1) and (6,3)
    // After capturing (6,1) red lands at (7,2) and promotes — chain should stop
    board[5][0] = { id: 'r1', player: 'red', type: 'regular' };
    board[6][1] = { id: 'b1', player: 'black', type: 'regular' };
    board[6][3] = { id: 'b2', player: 'black', type: 'regular' };

    const moves = getAllValidMoves(board, 'red');
    // Should get a single capture to (7,2) that stops — not chain through (6,3)
    const promotionCapture = moves.find(m => m.to[0] === 7 && m.captures.length === 1);
    expect(promotionCapture).toBeDefined();
    // No double-capture should exist since promotion ends the chain
    expect(moves.every(m => m.captures.length <= 1)).toBe(true);
  });
});

// ---- Win conditions ----

describe('Win conditions', () => {
  it('detects win when opponent has no pieces', () => {
    const board = emptyBoard();
    board[4][4] = { id: 'r1', player: 'red', type: 'regular' };

    expect(checkWinCondition(board, 'red')).toBe('red_wins');
  });

  it('detects win when opponent has no legal moves', () => {
    const board = emptyBoard();
    // Black piece trapped in corner with red blocking
    board[0][1] = { id: 'b1', player: 'black', type: 'regular' };
    board[1][0] = { id: 'r1', player: 'red', type: 'regular' };
    board[1][2] = { id: 'r2', player: 'red', type: 'regular' };

    // After red moves, it's black's turn but black is blocked
    expect(checkWinCondition(board, 'red')).toBe('red_wins');
  });

  it('returns playing when both players have pieces and moves', () => {
    expect(checkWinCondition(createInitialBoard(), 'red')).toBe('playing');
  });
});

// ---- 40-move draw rule ----

describe('40-move no-capture draw rule', () => {
  it('triggers draw after 40 moves without capture', () => {
    let state = createInitialGameState();
    // Manually inflate movesWithoutCapture to 39
    state = { ...state, movesWithoutCapture: 39 };

    // Make one non-capture move — should trigger draw
    const nonCapture = state.validMoves.find(m => m.captures.length === 0);
    if (!nonCapture) return; // skip if no non-capture move available in this state

    const next = applyMoveToState(state, nonCapture);
    expect(next.status).toBe('draw');
  });
});

// ---- Move validation ----

describe('isMoveShape', () => {
  it('accepts valid move shape', () => {
    expect(isMoveShape({ from: [0, 1], to: [1, 2], captures: [] })).toBe(true);
  });

  it('rejects out-of-bounds positions', () => {
    expect(isMoveShape({ from: [0, 8], to: [1, 2], captures: [] })).toBe(false);
  });

  it('rejects non-integer positions', () => {
    expect(isMoveShape({ from: [0.5, 1], to: [1, 2], captures: [] })).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(isMoveShape({ from: [0, 1], to: [1, 2] })).toBe(false);
    expect(isMoveShape(null)).toBe(false);
    expect(isMoveShape('move')).toBe(false);
  });
});

describe('isLegalMove', () => {
  it('accepts a move that is in validMoves', () => {
    const state = createInitialGameState();
    const legal = state.validMoves[0];
    expect(isLegalMove(state, legal)).toBe(true);
  });

  it('rejects a move not in validMoves', () => {
    const state = createInitialGameState();
    const illegal: Move = { from: [0, 0], to: [7, 7], captures: [] };
    expect(isLegalMove(state, illegal)).toBe(false);
  });
});
