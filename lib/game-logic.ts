export type Player = 'red' | 'black';
export type PieceType = 'regular' | 'king';

export interface Piece {
  id: string;
  player: Player;
  type: PieceType;
}

export type Board = (Piece | null)[][];

export interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedCell: [number, number] | null;
  validMoves: Move[];
  captured: { red: number; black: number };
  status: 'playing' | 'red_wins' | 'black_wins' | 'draw';
  moveHistory: Move[];
  movesWithoutCapture: number;
}

export interface GameRecord {
  id: string;
  date: string;
  mode: 'ai' | 'local' | 'online';
  result: 'win' | 'loss' | 'draw';
  opponent: string;
  moves: number;
  duration: number;
}

export interface PlayerStats {
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  city?: string;
}

let pieceIdCounter = 0;
function newPieceId(): string {
  return `piece-${++pieceIdCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Red pieces: rows 0-2 (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { id: newPieceId(), player: 'red', type: 'regular' };
      }
    }
  }

  // Black pieces: rows 5-7 (bottom)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { id: newPieceId(), player: 'black', type: 'regular' };
      }
    }
  }

  return board;
}

export function createInitialGameState(): GameState {
  const board = createInitialBoard();
  const validMoves = getAllValidMoves(board, 'red');
  return {
    board,
    currentPlayer: 'red',
    selectedCell: null,
    validMoves,
    captured: { red: 0, black: 0 },
    status: 'playing',
    moveHistory: [],
    movesWithoutCapture: 0,
  };
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    board: cloneBoard(state.board),
    selectedCell: state.selectedCell ? [...state.selectedCell] : null,
    validMoves: state.validMoves.map(m => ({
      from: [...m.from] as [number, number],
      to: [...m.to] as [number, number],
      captures: m.captures.map(c => [...c] as [number, number]),
    })),
    captured: { ...state.captured },
    moveHistory: state.moveHistory.map(m => ({
      from: [...m.from] as [number, number],
      to: [...m.to] as [number, number],
      captures: m.captures.map(c => [...c] as [number, number]),
    })),
  };
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isInteger(value[0]) &&
    Number.isInteger(value[1]) &&
    inBounds(value[0], value[1])
  );
}

export function isMoveShape(value: unknown): value is Move {
  if (!value || typeof value !== 'object') return false;
  const move = value as Partial<Move>;
  return (
    isPosition(move.from) &&
    isPosition(move.to) &&
    Array.isArray(move.captures) &&
    move.captures.every(isPosition)
  );
}

function samePosition(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function sameMove(a: Move, b: Move): boolean {
  return (
    samePosition(a.from, b.from) &&
    samePosition(a.to, b.to) &&
    a.captures.length === b.captures.length &&
    a.captures.every((capture, index) => samePosition(capture, b.captures[index]))
  );
}

export function isLegalMove(state: GameState, move: unknown): move is Move {
  return isMoveShape(move) && state.validMoves.some(validMove => sameMove(validMove, move));
}

function opponent(player: Player): Player {
  return player === 'red' ? 'black' : 'red';
}

// Get all chained capture sequences starting from a position
function getChainCaptures(
  board: Board,
  row: number,
  col: number,
  currentCaptures: [number, number][],
  visitedLandings: Set<string>
): Move[] {
  const piece = board[row][col];
  if (!piece) return [];

  const dirs: [number, number][] =
    piece.type === 'king'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.player === 'red'
      ? [[1, -1], [1, 1]]
      : [[-1, -1], [-1, 1]];

  const result: Move[] = [];

  for (const [dr, dc] of dirs) {
    const midRow = row + dr;
    const midCol = col + dc;
    const toRow = row + 2 * dr;
    const toCol = col + 2 * dc;
    const visitKey = `${toRow},${toCol}`;

    if (
      inBounds(toRow, toCol) &&
      board[midRow][midCol]?.player === opponent(piece.player) &&
      !currentCaptures.some(([r, c]) => r === midRow && c === midCol) &&
      board[toRow][toCol] === null &&
      !visitedLandings.has(visitKey)
    ) {
      const newCaptures: [number, number][] = [...currentCaptures, [midRow, midCol]];
      const newVisited = new Set(visitedLandings);
      newVisited.add(visitKey);

      // Temporarily move the piece to explore further captures
      const newBoard = cloneBoard(board);
      newBoard[toRow][toCol] = { ...piece };
      newBoard[row][col] = null;
      newBoard[midRow][midCol] = null;

      // Check if king promotion would occur mid-chain (English draughts: promotion ends chain)
      const wouldPromote =
        piece.type === 'regular' &&
        ((piece.player === 'red' && toRow === 7) ||
          (piece.player === 'black' && toRow === 0));

      const deeperCaptures = wouldPromote
        ? []
        : getChainCaptures(newBoard, toRow, toCol, newCaptures, newVisited);

      if (deeperCaptures.length === 0) {
        // This is a terminal capture sequence
        result.push({
          from: [row, col] as [number, number],
          to: [toRow, toCol] as [number, number],
          captures: newCaptures,
        });
      } else {
        // Continue chaining — update from to original start
        for (const deeper of deeperCaptures) {
          result.push({
            from: [row, col] as [number, number],
            to: deeper.to,
            captures: deeper.captures,
          });
        }
      }
    }
  }

  return result;
}

// Get all valid moves for a single piece
export function getPieceMoves(board: Board, row: number, col: number): Move[] {
  const piece = board[row][col];
  if (!piece) return [];

  // Check captures first
  const visited = new Set<string>();
  visited.add(`${row},${col}`);
  const captures = getChainCaptures(board, row, col, [], visited);
  if (captures.length > 0) return captures;

  // Regular moves
  const dirs: [number, number][] =
    piece.type === 'king'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.player === 'red'
      ? [[1, -1], [1, 1]]
      : [[-1, -1], [-1, 1]];

  const moves: Move[] = [];
  for (const [dr, dc] of dirs) {
    const toRow = row + dr;
    const toCol = col + dc;
    if (inBounds(toRow, toCol) && board[toRow][toCol] === null) {
      moves.push({ from: [row, col], to: [toRow, toCol], captures: [] });
    }
  }
  return moves;
}

export function getAllValidMoves(board: Board, player: Player): Move[] {
  const allCaptures: Move[] = [];
  const allMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece?.player !== player) continue;

      const visited = new Set<string>();
      visited.add(`${row},${col}`);
      const captures = getChainCaptures(board, row, col, [], visited);
      allCaptures.push(...captures);

      if (captures.length === 0) {
        const dirs: [number, number][] =
          piece.type === 'king'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : player === 'red'
            ? [[1, -1], [1, 1]]
            : [[-1, -1], [-1, 1]];

        for (const [dr, dc] of dirs) {
          const toRow = row + dr;
          const toCol = col + dc;
          if (inBounds(toRow, toCol) && board[toRow][toCol] === null) {
            allMoves.push({ from: [row, col], to: [toRow, toCol], captures: [] });
          }
        }
      }
    }
  }

  // Mandatory capture rule
  if (allCaptures.length > 0) return allCaptures;
  return allMoves;
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from[0]][move.from[1]]!;

  newBoard[move.to[0]][move.to[1]] = piece;
  newBoard[move.from[0]][move.from[1]] = null;

  for (const [r, c] of move.captures) {
    newBoard[r][c] = null;
  }

  // King promotion
  if (piece.type === 'regular') {
    if (
      (piece.player === 'red' && move.to[0] === 7) ||
      (piece.player === 'black' && move.to[0] === 0)
    ) {
      newBoard[move.to[0]][move.to[1]] = { ...piece, type: 'king' };
    }
  }

  return newBoard;
}

export function checkWinCondition(
  board: Board,
  currentPlayer: Player
): 'playing' | 'red_wins' | 'black_wins' | 'draw' {
  const nextPlayer = opponent(currentPlayer);
  const nextMoves = getAllValidMoves(board, nextPlayer);

  if (nextMoves.length === 0) {
    return currentPlayer === 'red' ? 'red_wins' : 'black_wins';
  }

  // Count pieces
  let redCount = 0;
  let blackCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.player === 'red') redCount++;
      if (board[r][c]?.player === 'black') blackCount++;
    }
  }
  if (redCount === 0) return 'black_wins';
  if (blackCount === 0) return 'red_wins';

  return 'playing';
}

export function applyMoveToState(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    return state;
  }

  const newBoard = applyMove(state.board, move);
  const capturedCount = move.captures.length;
  const newCaptured = { ...state.captured };

  if (state.currentPlayer === 'red') {
    newCaptured.black += capturedCount;
  } else {
    newCaptured.red += capturedCount;
  }

  const newMovesWithoutCapture = capturedCount > 0 ? 0 : state.movesWithoutCapture + 1;
  const newHistory = [...state.moveHistory, move];
  const nextPlayer = opponent(state.currentPlayer);
  let newStatus = checkWinCondition(newBoard, state.currentPlayer);

  // 40-move no-capture draw rule (English draughts standard)
  if (newStatus === 'playing' && newMovesWithoutCapture >= 40) {
    newStatus = 'draw';
  }

  const newValidMoves = newStatus === 'playing' ? getAllValidMoves(newBoard, nextPlayer) : [];

  return {
    board: newBoard,
    currentPlayer: nextPlayer,
    selectedCell: null,
    validMoves: newValidMoves,
    captured: newCaptured,
    status: newStatus,
    moveHistory: newHistory,
    movesWithoutCapture: newMovesWithoutCapture,
  };
}

export function getMovesForCell(
  validMoves: Move[],
  row: number,
  col: number
): Move[] {
  return validMoves.filter(m => m.from[0] === row && m.from[1] === col);
}

// ---- AI Analysis ----
export interface AnalysisNote {
  moveIndex: number;
  player: Player;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export function analyzeGame(moveHistory: Move[]): AnalysisNote[] {
  const notes: AnalysisNote[] = [];
  let board = createInitialBoard();
  let currentPlayer: Player = 'red';

  for (let i = 0; i < moveHistory.length; i++) {
    const move = moveHistory[i];

    // Check for missed captures: did the player have more captures available?
    const allMoves = getAllValidMoves(board, currentPlayer);
    const captureMoves = allMoves.filter(m => m.captures.length > 0);
    if (captureMoves.length > 0 && move.captures.length === 0) {
      notes.push({
        moveIndex: i + 1,
        player: currentPlayer,
        message: `Move ${i + 1}: You missed a mandatory capture! Captures were available.`,
        severity: 'error',
      });
    } else if (captureMoves.length > 0 && move.captures.length < Math.max(...captureMoves.map(m => m.captures.length))) {
      const maxCaptures = Math.max(...captureMoves.map(m => m.captures.length));
      if (move.captures.length < maxCaptures) {
        notes.push({
          moveIndex: i + 1,
          player: currentPlayer,
          message: `Move ${i + 1}: You could have captured ${maxCaptures} pieces but only captured ${move.captures.length}.`,
          severity: 'warning',
        });
      }
    }

    // Check if moving to a position that can be immediately captured
    board = applyMove(board, move);
    const oppMoves = getAllValidMoves(board, opponent(currentPlayer));
    const dangerousCaptures = oppMoves.filter(m =>
      m.captures.some(([r, c]) => r === move.to[0] && c === move.to[1])
    );
    if (dangerousCaptures.length > 0) {
      const movedPiece = board[move.to[0]][move.to[1]];
      if (movedPiece?.type === 'king') {
        notes.push({
          moveIndex: i + 1,
          player: currentPlayer,
          message: `Move ${i + 1}: This move exposed your king to capture!`,
          severity: 'warning',
        });
      } else {
        notes.push({
          moveIndex: i + 1,
          player: currentPlayer,
          message: `Move ${i + 1}: This move left a piece vulnerable to capture.`,
          severity: 'info',
        });
      }
    }

    currentPlayer = opponent(currentPlayer);
  }

  if (notes.length === 0) {
    notes.push({
      moveIndex: 0,
      player: 'red',
      message: 'Great game! No major mistakes detected.',
      severity: 'info',
    });
  }

  return notes;
}
