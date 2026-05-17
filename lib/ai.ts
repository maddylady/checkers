import {
  Board,
  Move,
  Player,
  getAllValidMoves,
  applyMove,
  checkWinCondition,
} from './game-logic';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Maps bot ELO (350–2200) to { randomChance, depth }
function paramsFromStrength(strength: number): { depth: number; randomChance: number } {
  // strength is 0–100 (normalised from ELO)
  if (strength < 10) return { depth: 1, randomChance: 0.92 };
  if (strength < 20) return { depth: 1, randomChance: 0.82 };
  if (strength < 30) return { depth: 1, randomChance: 0.70 };
  if (strength < 42) return { depth: 2, randomChance: 0.45 };
  if (strength < 55) return { depth: 3, randomChance: 0.20 };
  if (strength < 65) return { depth: 4, randomChance: 0.08 };
  if (strength < 75) return { depth: 4, randomChance: 0.02 };
  if (strength < 83) return { depth: 5, randomChance: 0 };
  if (strength < 92) return { depth: 6, randomChance: 0 };
  return { depth: 7, randomChance: 0 };
}

// Board evaluation: positive = red winning, negative = black winning
function evaluateBoard(board: Board): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      let value = 0;

      if (piece.type === 'king') {
        value = 10;
      } else {
        value = 5;
        // Bonus for advancement
        if (piece.player === 'red') {
          value += row * 0.3; // Red advances toward row 7
        } else {
          value += (7 - row) * 0.3; // Black advances toward row 0
        }
      }

      // Center control bonus
      if (col >= 2 && col <= 5 && row >= 2 && row <= 5) {
        value += 0.5;
      }

      // Back row protection bonus
      if (piece.player === 'red' && row === 0) value += 1;
      if (piece.player === 'black' && row === 7) value += 1;

      // Edge penalty (less maneuverable)
      if (col === 0 || col === 7) value -= 0.3;

      if (piece.player === 'red') {
        score += value;
      } else {
        score -= value;
      }
    }
  }

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean, // true = red's turn
  currentPlayer: Player
): number {
  const status = checkWinCondition(board, currentPlayer === 'red' ? 'black' : 'red');

  if (status === 'red_wins') return 1000 + depth;
  if (status === 'black_wins') return -1000 - depth;
  if (status === 'draw') return 0;

  if (depth === 0) return evaluateBoard(board);

  const moves = getAllValidMoves(board, currentPlayer);
  if (moves.length === 0) {
    return maximizing ? -1000 - depth : 1000 + depth;
  }

  const nextPlayer: Player = currentPlayer === 'red' ? 'black' : 'red';

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, nextPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, nextPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

// Fallback difficulty params when no botElo is provided (mines/roulette modes)
function defaultParams(difficulty: Difficulty): { depth: number; randomChance: number } {
  switch (difficulty) {
    case 'easy':   return { depth: 1, randomChance: 0.80 };
    case 'medium': return { depth: 4, randomChance: 0.12 };
    case 'hard':   return { depth: 7, randomChance: 0 };
  }
}

export function getBestMove(
  board: Board,
  player: Player,
  difficulty: Difficulty,
  botElo?: number,
): Move | null {
  const moves = getAllValidMoves(board, player);
  if (moves.length === 0) return null;

  // Derive strength 0–100 from ELO if available, else use difficulty defaults
  const params = botElo !== undefined
    ? paramsFromStrength(Math.min(100, Math.max(0, Math.round((botElo - 350) / (2200 - 350) * 100))))
    : defaultParams(difficulty);

  if (Math.random() < params.randomChance) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const maximizing = player === 'red';
  let bestMove: Move = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const newBoard = applyMove(board, move);
    const nextPlayer: Player = player === 'red' ? 'black' : 'red';
    const score = minimax(newBoard, params.depth - 1, -Infinity, Infinity, !maximizing, nextPlayer);

    if (maximizing && score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (!maximizing && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
