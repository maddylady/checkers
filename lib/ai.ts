import {
  Board,
  Move,
  Player,
  getAllValidMoves,
  applyMove,
  checkWinCondition,
} from './game-logic';

export type Difficulty = 'easy' | 'medium' | 'hard';

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

function getDepth(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 2;
    case 'medium': return 4;
    case 'hard': return 7;
  }
}

export function getBestMove(
  board: Board,
  player: Player,
  difficulty: Difficulty
): Move | null {
  const moves = getAllValidMoves(board, player);
  if (moves.length === 0) return null;

  // Easy: pick a random move 60% of the time, else minimax at depth 2
  if (difficulty === 'easy' && Math.random() < 0.6) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = getDepth(difficulty);
  const maximizing = player === 'red';

  let bestMove: Move = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const newBoard = applyMove(board, move);
    const nextPlayer: Player = player === 'red' ? 'black' : 'red';
    const score = minimax(
      newBoard,
      depth - 1,
      -Infinity,
      Infinity,
      !maximizing,
      nextPlayer
    );

    if (maximizing && score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (!maximizing && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // Medium: add a tiny bit of randomness to make it feel more natural
  if (difficulty === 'medium' && Math.random() < 0.15) {
    const topMoves = moves.filter(m => {
      const newBoard = applyMove(board, m);
      const nextPlayer: Player = player === 'red' ? 'black' : 'red';
      const score = minimax(newBoard, 2, -Infinity, Infinity, !maximizing, nextPlayer);
      return Math.abs(score - bestScore) < 2;
    });
    if (topMoves.length > 0) {
      return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
  }

  return bestMove;
}
