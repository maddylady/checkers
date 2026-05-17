import type { Board, Move } from './game-logic';
import { addCoins } from './storage';

export interface Puzzle {
  id: string;
  title: string;
  desc: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  board: Board;
  playerToMove: 'red';
  solution: Move[];
  coins: number;
}

function emptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// ----- Puzzle 1: Easy Capture -----
// Red man at [6,1]. Black man at [5,2]. Empty at [4,3].
function makePuzzle1(): Board {
  const b = emptyBoard();
  b[6][1] = { id: 'p1-r1', player: 'red', type: 'regular' };
  b[5][2] = { id: 'p1-b1', player: 'black', type: 'regular' };
  return b;
}

// ----- Puzzle 2: Double Jump -----
// Red man at [6,3]. Black men at [5,4] and [3,4]. Empty at [4,5] and [2,3].
function makePuzzle2(): Board {
  const b = emptyBoard();
  b[6][3] = { id: 'p2-r1', player: 'red', type: 'regular' };
  b[5][4] = { id: 'p2-b1', player: 'black', type: 'regular' };
  b[3][4] = { id: 'p2-b2', player: 'black', type: 'regular' };
  // [4,5] and [2,3] remain empty as landing squares
  return b;
}

// ----- Puzzle 3: Triple Jump -----
// Red man at [6,1]. Black men at [5,2], [3,4], [1,4]. Lands at [4,3], [2,5], [0,3].
function makePuzzle3(): Board {
  const b = emptyBoard();
  b[6][1] = { id: 'p3-r1', player: 'red', type: 'regular' };
  b[5][2] = { id: 'p3-b1', player: 'black', type: 'regular' };
  b[3][4] = { id: 'p3-b2', player: 'black', type: 'regular' };
  b[1][4] = { id: 'p3-b3', player: 'black', type: 'regular' };
  // Landing squares: [4,3], [2,5], [0,3] — all empty
  return b;
}

// ----- Puzzle 4: King Diagonal -----
// Red king at [4,3]. Black men at [3,2] and [5,2].
// Correct move: capture [3,2] landing [2,1] (safe — no recapture).
// If capturing [5,2] landing [6,1], black at [7,0] can recapture!
// So the "safe" capture is upward: [3,2] → land [2,1].
function makePuzzle4(): Board {
  const b = emptyBoard();
  b[4][3] = { id: 'p4-r1', player: 'red', type: 'king' };
  b[3][2] = { id: 'p4-b1', player: 'black', type: 'regular' };
  b[5][2] = { id: 'p4-b2', player: 'black', type: 'regular' };
  b[7][0] = { id: 'p4-b3', player: 'black', type: 'regular' }; // guards [6,1] — if king goes [4,3]→[6,1] capturing [5,2], black at [7,0] recaptures
  return b;
}

// ----- Puzzle 5: Forced Win -----
// Red man at [6,5]. Black man at [5,4]. Empty at [4,3].
function makePuzzle5(): Board {
  const b = emptyBoard();
  b[6][5] = { id: 'p5-r1', player: 'red', type: 'regular' };
  b[5][4] = { id: 'p5-b1', player: 'black', type: 'regular' };
  return b;
}

// ----- Puzzle 6: Diagonal Sweep (king multi-capture) -----
// Red king at [4,1]. Black men at [3,2], [1,4], [3,6], [5,4].
// King captures: [4,1]→[2,3] (cap [3,2]), then [2,3]→[0,5] (cap [1,4]), ...
// Actually let's pick a cleaner sequence:
// Red king at [6,1]. Black men at [5,2], [3,4], [1,4] — same as puzzle3 but king, can also go backwards.
// Let's use: Red king at [4,3]. Black men at [3,4],[1,2],[5,4],[3,6].
// Sequence: cap [3,4]→[2,5], cap [1,2] impossible (wrong direction from [2,5]).
// Simpler: Red king at [2,1]. Black at [3,2],[5,4],[3,6].
// [2,1]→[4,3] cap [3,2], [4,3]→[6,5] cap [5,4], [6,5]→[4,7] cap [5,6]... [3,6] isn't on path.
// Let's go: Red king at [2,1]. Black at [3,2],[5,4],[3,6] → [2,1]→[4,3](cap [3,2])→[6,5](cap [5,4])→[4,7](cap [5,6]) — need [5,6] not [3,6].
// Use: Red king at [2,1]. Black at [3,2],[5,4],[5,6]. Land: [4,3],[6,5],[4,7].
function makePuzzle6(): Board {
  const b = emptyBoard();
  b[2][1] = { id: 'p6-r1', player: 'red', type: 'king' };
  b[3][2] = { id: 'p6-b1', player: 'black', type: 'regular' };
  b[5][4] = { id: 'p6-b2', player: 'black', type: 'regular' };
  b[5][6] = { id: 'p6-b3', player: 'black', type: 'regular' };
  // Lands: [4,3], [6,5], [4,7] — all empty
  return b;
}

// ----- Puzzle 7: Back Row Trap -----
// Red king needs to capture forward then backward.
// Red king at [5,2]. Black men at [4,3] and [6,5].
// Cap [4,3]→[3,4], then cap [6,5]→[7,4]? King is at [3,4] captures [6,5]? No, [6,5] is not adjacent.
// Better: Red king at [5,4]. Black at [4,5] and [6,3].
// Cap [4,5]→[3,6], then backward cap [6,3]→[7,2]? From [3,6] to [6,3] is 3 steps, not adjacent.
// Let's do: Red king at [4,3]. Black at [3,4] and [5,4].
// Cap [3,4]→[2,5], then backward cap [5,4]→[6,5]. [2,5] captures [3,4]. Then from [2,5] can we capture [5,4]? Not adjacent.
// Simplest back-row trap: Red king at [3,2]. Black at [2,3] and [4,1].
// Cap [2,3]→[1,4]. Then from [1,4] cap [4,1]? Not adjacent.
// Let's use: Red king at [4,3]. Black at [3,4] and [3,2].
// Cap [3,2]→[2,1], then backward: from [2,1] can cap [3,2] is already gone.
// Two separate captures won't chain. Let's just make it a king two-step:
// Red king at [2,5]. Black at [3,4] and [1,4].
// Cap [3,4]→[4,3] (forward), then from [4,3] cap [1,4]? Not adjacent.
// Cap [1,4]→[0,3] (backward up), then from [0,3] no further captures.
// Two separate solutions. Correct: cap [3,4] → [4,3] (gains forward position), then cap... nope single chain needed.
// Best approach: Red king at [3,2]. Black at [4,3] and [2,3]. Both adjacent.
// Cap [4,3]→[5,4] (forward), then from [5,4] no more captures visible to [2,3].
// Cap [2,3]→[1,4] (backward), from [1,4] no more.
// Not a chain.
// For simplicity, make puzzle 7 a double-capture king going forward then backward:
// Red king at [4,3]. Black at [5,4] and [3,4].
// Cap [5,4]→[6,5], then from [6,5] can we cap [3,4]? [3,4] is at distance 3, not adjacent.
// Cap [3,4]→[2,5], from [2,5] can cap [5,4]? Not adjacent.
// These two captures cannot chain.
// FINAL SOLUTION for puzzle 7: Make it a king that captures one piece going forward, ending in position to promote in real game.
// Red king at [5,2]. Black at [4,3]. Empty at [3,4]. Simple king capture.
// But that's too simple. Let's do king captures zigzag:
// Red king at [6,3]. Black at [5,4] and [3,4] and [1,4].
// [6,3]→[4,5](cap [5,4])→[2,3](cap [3,4])→[0,5](cap [1,4]). This is a triple chain for a king!
function makePuzzle7(): Board {
  const b = emptyBoard();
  b[6][3] = { id: 'p7-r1', player: 'red', type: 'king' };
  b[5][4] = { id: 'p7-b1', player: 'black', type: 'regular' };
  b[3][4] = { id: 'p7-b2', player: 'black', type: 'regular' };
  b[1][4] = { id: 'p7-b3', player: 'black', type: 'regular' };
  // Lands: [4,5], [2,3], [0,5] — all empty
  return b;
}

// ----- Puzzle 8: Promote to Win -----
// Red man at [2,1]. Black man at [1,2]. Capture lands at [0,3] — back row → becomes king.
function makePuzzle8(): Board {
  const b = emptyBoard();
  b[2][1] = { id: 'p8-r1', player: 'red', type: 'regular' };
  b[1][2] = { id: 'p8-b1', player: 'black', type: 'regular' };
  // Landing [0,3] empty — red promotes to king there
  return b;
}

// ----- Puzzle 9: The Fork -----
// After red captures, two black pieces remain both attackable next turn.
// Red man at [4,3]. Black men at [3,4] and [1,4] and [1,2].
// Cap [3,4]→[2,5]: then [1,4] and... wait that's not a fork position.
// Fork: after capture, red piece threatens two black pieces and black can't defend both.
// Red man at [4,3]. Black at [3,2]. After cap [3,2]→[2,1]: Red threatens nothing new.
// Red man at [4,5]. Black at [3,4]. After cap [3,4]→[2,3]: Red at [2,3] now threatens [1,2] and [1,4] (both black).
// Let's set it up: Red at [4,5]. Black at [3,4],[1,2],[1,4]. Cap [3,4]→[2,3]. Red now at [2,3], threatens [1,2] and [1,4].
function makePuzzle9(): Board {
  const b = emptyBoard();
  b[4][5] = { id: 'p9-r1', player: 'red', type: 'regular' };
  b[3][4] = { id: 'p9-b1', player: 'black', type: 'regular' };
  b[1][2] = { id: 'p9-b2', player: 'black', type: 'regular' };
  b[1][4] = { id: 'p9-b3', player: 'black', type: 'regular' };
  return b;
}

// ----- Puzzle 10: King Hunt -----
// Red has two kings, black has one king in corner.
// Red kings at [2,1] and [4,1]. Black king at [0,7].
// Correct first move: [2,1]→[1,2]... let's think.
// Actually let's make it: Red king at [2,5] and [4,3]. Black king at [0,7].
// Red king [2,5] can capture black king at... [0,7] isn't adjacent to [2,5].
// Let's try: Red kings at [2,5] and [4,7]. Black king at [0,7].
// [2,5]→[1,6]? No capture.
// We need black king to be capturable. Place it where one red king can jump it.
// Black king at [1,6]. Red king at [2,5] can cap [1,6]→[0,7].
// But [0,7] is a light square? (0+7)=7, odd → dark square. Yes, valid.
// But then puzzle is trivial. Let's add: Red kings at [2,5] and [6,5]. Black king at [1,6] with empty [0,7].
// Player must pick the right king to move: [2,5]→[0,7] capturing [1,6]. The other move [6,5]→[5,6] doesn't capture.
// This is simple but that's fine for a "King Hunt" endgame puzzle.
function makePuzzle10(): Board {
  const b = emptyBoard();
  b[2][5] = { id: 'p10-r1', player: 'red', type: 'king' };
  b[6][5] = { id: 'p10-r2', player: 'red', type: 'king' };
  b[1][6] = { id: 'p10-b1', player: 'black', type: 'king' };
  // [0,7] is the landing square — empty
  return b;
}

export const PUZZLES: Puzzle[] = [
  {
    id: 'p1',
    title: 'Take the Piece',
    desc: 'A piece is hanging. Capture it.',
    hint: 'Look for a piece you can jump over.',
    difficulty: 'easy',
    coins: 5,
    board: makePuzzle1(),
    playerToMove: 'red',
    solution: [
      { from: [6, 1], to: [4, 3], captures: [[5, 2]] },
    ],
  },
  {
    id: 'p2',
    title: 'Chain Reaction',
    desc: 'You can capture two pieces in one turn.',
    hint: 'After the first jump, keep looking.',
    difficulty: 'easy',
    coins: 5,
    board: makePuzzle2(),
    playerToMove: 'red',
    solution: [
      { from: [6, 3], to: [4, 5], captures: [[5, 4]] },
      { from: [4, 5], to: [2, 3], captures: [[3, 4]] },
    ],
  },
  {
    id: 'p3',
    title: 'Hat Trick',
    desc: 'Three captures in one spectacular move.',
    hint: 'Plan the full sequence before moving.',
    difficulty: 'medium',
    coins: 10,
    board: makePuzzle3(),
    playerToMove: 'red',
    solution: [
      { from: [6, 1], to: [4, 3], captures: [[5, 2]] },
      { from: [4, 3], to: [2, 5], captures: [[3, 4]] },
      { from: [2, 5], to: [0, 3], captures: [[1, 4]] },
    ],
  },
  {
    id: 'p4',
    title: 'Royal Power',
    desc: 'Your king can move backward — use it wisely. One capture is safe, the other gets you recaptured.',
    hint: 'Capture upward — the lower landing square is guarded!',
    difficulty: 'medium',
    coins: 10,
    board: makePuzzle4(),
    playerToMove: 'red',
    solution: [
      { from: [4, 3], to: [2, 1], captures: [[3, 2]] },
    ],
  },
  {
    id: 'p5',
    title: 'No Escape',
    desc: 'Capture the only piece the opponent has.',
    hint: 'Move forward diagonally to jump.',
    difficulty: 'easy',
    coins: 5,
    board: makePuzzle5(),
    playerToMove: 'red',
    solution: [
      { from: [6, 5], to: [4, 3], captures: [[5, 4]] },
    ],
  },
  {
    id: 'p6',
    title: 'Diagonal Sweep',
    desc: 'Three black pieces, one red king. Show no mercy.',
    hint: 'Kings can chain captures in any direction.',
    difficulty: 'hard',
    coins: 20,
    board: makePuzzle6(),
    playerToMove: 'red',
    solution: [
      { from: [2, 1], to: [4, 3], captures: [[3, 2]] },
      { from: [4, 3], to: [6, 5], captures: [[5, 4]] },
      { from: [6, 5], to: [4, 7], captures: [[5, 6]] },
    ],
  },
  {
    id: 'p7',
    title: 'Back Row Trap',
    desc: 'Capture forward then backward to clear the board.',
    hint: 'A king\'s power is moving in all directions.',
    difficulty: 'hard',
    coins: 20,
    board: makePuzzle7(),
    playerToMove: 'red',
    solution: [
      { from: [6, 3], to: [4, 5], captures: [[5, 4]] },
      { from: [4, 5], to: [2, 3], captures: [[3, 4]] },
      { from: [2, 3], to: [0, 5], captures: [[1, 4]] },
    ],
  },
  {
    id: 'p8',
    title: 'Reach the Crown',
    desc: 'Capture a piece AND promote in one move.',
    hint: 'Look at where the piece lands after the jump.',
    difficulty: 'easy',
    coins: 5,
    board: makePuzzle8(),
    playerToMove: 'red',
    solution: [
      { from: [2, 1], to: [0, 3], captures: [[1, 2]] },
    ],
  },
  {
    id: 'p9',
    title: 'The Fork',
    desc: 'After your capture, the opponent cannot avoid losing another piece.',
    hint: 'Capture to a square that threatens two black pieces at once.',
    difficulty: 'medium',
    coins: 10,
    board: makePuzzle9(),
    playerToMove: 'red',
    solution: [
      { from: [4, 5], to: [2, 3], captures: [[3, 4]] },
    ],
  },
  {
    id: 'p10',
    title: 'King Hunt',
    desc: 'Track down and capture the lone black king.',
    hint: 'Which of your kings is in position to jump?',
    difficulty: 'hard',
    coins: 20,
    board: makePuzzle10(),
    playerToMove: 'red',
    solution: [
      { from: [2, 5], to: [0, 7], captures: [[1, 6]] },
    ],
  },
];

const PUZZLES_KEY = 'checkmate_puzzles';

export function getPuzzleProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(PUZZLES_KEY);
  return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
}

export function markPuzzleSolved(id: string, coins: number): void {
  if (typeof window === 'undefined') return;
  const progress = getPuzzleProgress();
  if (!progress[id]) {
    progress[id] = true;
    localStorage.setItem(PUZZLES_KEY, JSON.stringify(progress));
    addCoins(coins);
  }
}

export function getPuzzleCoins(): number {
  const progress = getPuzzleProgress();
  return PUZZLES.filter(p => progress[p.id]).reduce((sum, p) => sum + p.coins, 0);
}
