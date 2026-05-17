'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Board from './Board';
import GameControls from './GameControls';
import WinScreen from './WinScreen';
import {
  createInitialGameState,
  applyMoveToState,
  getMovesForCell,
  getAllValidMoves,
  analyzeGame,
  isLegalMove,
  type GameState,
  type Player,
  type Move,
  type AnalysisNote,
} from '@/lib/game-logic';
import { getBestMove, type Difficulty } from '@/lib/ai';
import { recordGameResult } from '@/lib/storage';
import type { GameMode } from './ModeSelector';
import { ArrowLeft, Copy, Check as CheckIcon } from 'lucide-react';

type SocketType = ReturnType<typeof import('socket.io-client').io>;

interface GamePageProps {
  mode: GameMode;
  difficulty?: Difficulty;
  roomCode?: string;
  username: string;
  playerColor?: Player;
  onExit: () => void;
}

export default function GamePage({
  mode,
  difficulty = 'medium',
  roomCode,
  username,
  playerColor: initialPlayerColor,
  onExit,
}: GamePageProps) {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [playerColor, setPlayerColor] = useState<Player>(initialPlayerColor || 'red');
  const [showWin, setShowWin] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState<AnalysisNote[]>([]);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [copied, setCopied] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<'connecting' | 'waiting' | 'playing' | 'error'>('connecting');
  const [opponentName, setOpponentName] = useState<string>('');

  // thinking is derived — true whenever it's the AI's turn
  const thinking = mode === 'ai' && gameState.status === 'playing' && gameState.currentPlayer !== playerColor;

  const gameStartTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerCountRef = useRef<number>(30);
  const gameStateRef = useRef<GameState>(gameState);
  const playerColorRef = useRef<Player>(playerColor);
  const opponentNameRef = useRef<string>(opponentName);
  const socketRef = useRef<SocketType | null>(null);

  // Keep refs current — useLayoutEffect runs sync after paint, safe for effects/handlers
  useLayoutEffect(() => {
    gameStateRef.current = gameState;
    playerColorRef.current = playerColor;
    opponentNameRef.current = opponentName;
  });

  // Record start time once on mount
  useLayoutEffect(() => {
    gameStartTime.current = Date.now();
  }, []);

  // ---- Handlers (declared before effects so effects can reference them) ----
  const handleMove = (move: Move) => {
    if (!isLegalMove(gameStateRef.current, move)) return;

    if (mode === 'online' && socketRef.current) {
      socketRef.current.emit('make-move', { roomCode, move });
    }
    setGameState(prev => applyMoveToState(prev, move));
  };

  const handleCellClick = (row: number, col: number) => {
    const state = gameStateRef.current;
    if (state.status !== 'playing') return;
    if (mode === 'online' && state.currentPlayer !== playerColor) return;
    if (mode === 'ai' && state.currentPlayer !== playerColor) return;

    const clickedPiece = state.board[row][col];

    if (state.selectedCell) {
      const [selRow, selCol] = state.selectedCell;
      const movesFromSelected = getMovesForCell(state.validMoves, selRow, selCol);
      const matchingMove = movesFromSelected.find(m => m.to[0] === row && m.to[1] === col);

      if (matchingMove) {
        handleMove(matchingMove);
        return;
      }

      if (clickedPiece?.player === state.currentPlayer) {
        const pieceMoves = getMovesForCell(state.validMoves, row, col);
        if (pieceMoves.length > 0) {
          setGameState(prev => ({ ...prev, selectedCell: [row, col] }));
          return;
        }
      }

      setGameState(prev => ({ ...prev, selectedCell: null }));
      return;
    }

    if (clickedPiece?.player === state.currentPlayer) {
      const pieceMoves = getMovesForCell(state.validMoves, row, col);
      if (pieceMoves.length > 0) {
        setGameState(prev => ({ ...prev, selectedCell: [row, col] }));
      }
    }
  };

  const handleRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState(createInitialGameState());
    setShowWin(false);
    gameStartTime.current = Date.now();
  };

  const handleResign = () => {
    setGameState(prev => ({
      ...prev,
      status: prev.currentPlayer === 'red' ? 'black_wins' : 'red_wins',
    }));
  };

  // ---- Timer ----
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    timerCountRef.current = 30;
    // Defer initial display update — avoids synchronous setState inside effect
    const resetTimer = setTimeout(() => setTurnTimer(30), 0);
    timerRef.current = setInterval(() => {
      timerCountRef.current -= 1;
      setTurnTimer(timerCountRef.current);

      if (timerCountRef.current <= 0) {
        const moves = getAllValidMoves(gameStateRef.current.board, gameStateRef.current.currentPlayer);
        if (moves.length > 0) {
          handleMove(moves[Math.floor(Math.random() * moves.length)]);
        }
        timerCountRef.current = 30;
        setTurnTimer(30);
      }
    }, 1000);

    return () => {
      clearTimeout(resetTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.status]);

  // ---- AI move ----
  useEffect(() => {
    if (mode !== 'ai') return;
    if (gameState.status !== 'playing') return;
    if (gameState.currentPlayer === playerColor) return;

    const aiPlayer: Player = playerColor === 'red' ? 'black' : 'red';

    const timer = setTimeout(() => {
      const best = getBestMove(gameState.board, aiPlayer, difficulty);
      if (best) {
        setGameState(prev => applyMoveToState(prev, best));
      }
    }, 500 + Math.random() * 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.status, mode]);

  // ---- Win detection ----
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);

      const duration = Math.floor((Date.now() - gameStartTime.current) / 1000);
      const color = playerColorRef.current;
      let result: 'win' | 'loss' | 'draw' = 'draw';
      if (gameState.status === 'red_wins') {
        result = color === 'red' ? 'win' : 'loss';
      } else if (gameState.status === 'black_wins') {
        result = color === 'black' ? 'win' : 'loss';
      }
      const opp = mode === 'ai' ? `AI (${difficulty})` : opponentNameRef.current || 'Player 2';
      recordGameResult(result, mode, opp, gameState.moveHistory.length, duration);

      const notes = analyzeGame(gameState.moveHistory);
      const t = setTimeout(() => {
        setAnalysisNotes(notes);
        setShowWin(true);
      }, 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status]);

  // ---- Online multiplayer setup ----
  useEffect(() => {
    if (mode !== 'online' || !roomCode) return;

    async function setupSocket() {
      try {
        const { io } = await import('socket.io-client');
        const s = io(window.location.origin, { path: '/api/socket' });
        socketRef.current = s;

        s.on('connect', () => {
          s.emit('join-room', { roomCode, username });
        });

        s.on('room-joined', (data: { color: Player; opponentName?: string }) => {
          setPlayerColor(data.color);
          if (data.opponentName) {
            setOpponentName(data.opponentName);
            setOnlineStatus('playing');
          } else {
            setOnlineStatus('waiting');
          }
        });

        s.on('opponent-joined', (data: { username: string }) => {
          setOpponentName(data.username);
          setOnlineStatus('playing');
        });

        s.on('move-made', (move: Move) => {
          setGameState(prev => applyMoveToState(prev, move));
        });

        s.on('opponent-disconnected', () => {
          setOnlineStatus('error');
        });

        s.on('room-full', () => {
          setOnlineStatus('error');
        });

        s.on('room-error', () => {
          setOnlineStatus('error');
        });

        s.on('connect_error', () => {
          setOnlineStatus('error');
        });
      } catch {
        setOnlineStatus('error');
      }
    }

    setupSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roomCode]);

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPlayerTurn = mode === 'local' || gameState.currentPlayer === playerColor;
  const flipBoard = mode === 'local' ? gameState.currentPlayer === 'red' : playerColor === 'red';

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* Left sidebar */}
        <div className="flex flex-col gap-4 lg:w-64 order-2 lg:order-1">
          {/* Back button */}
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back to Menu
          </button>

          {/* Room code for online */}
          {mode === 'online' && roomCode && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Room Code</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-amber-400 tracking-widest">{roomCode}</span>
                <button onClick={copyRoomCode} className="text-gray-400 hover:text-white transition-colors">
                  {copied ? <CheckIcon size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <div className={`mt-2 text-xs ${
                onlineStatus === 'waiting' ? 'text-yellow-400 animate-pulse' :
                onlineStatus === 'playing' ? 'text-green-400' :
                onlineStatus === 'error' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {onlineStatus === 'connecting' ? '● Connecting...' :
                 onlineStatus === 'waiting' ? '● Waiting for opponent...' :
                 onlineStatus === 'playing' ? `● Playing vs ${opponentName}` :
                 '● Connection lost'}
              </div>
            </div>
          )}

          {/* Game controls */}
          <GameControls
            gameState={gameState}
            mode={mode}
            aiDifficulty={mode === 'ai' ? difficulty : undefined}
            onRestart={handleRestart}
            onResign={handleResign}
            playerColor={mode !== 'local' ? playerColor : undefined}
            turnTimer={turnTimer}
            opponentName={mode === 'ai' ? `AI (${difficulty})` : opponentName}
            thinking={thinking}
          />
        </div>

        {/* Main board area */}
        <div className="flex-1 flex items-start justify-center order-1 lg:order-2">
          <div className="flex flex-col items-center gap-4">
            {/* Player labels */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-600 to-gray-900 border border-gray-400" />
              <span className="text-gray-300 text-sm">
                {mode === 'ai' && playerColor === 'black' ? username :
                 mode === 'online' && playerColor === 'black' ? username :
                 mode === 'local' ? 'Black' :
                 opponentName || `AI (${difficulty})`}
              </span>
              {gameState.currentPlayer === 'black' && gameState.status === 'playing' && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-2 rounded-full bg-green-400"
                />
              )}
            </div>

            <Board
              gameState={gameState}
              onCellClick={handleCellClick}
              flipped={flipBoard}
              disabled={!isPlayerTurn || thinking || gameState.status !== 'playing'}
            />

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 border border-red-300" />
              <span className="text-gray-300 text-sm">
                {mode === 'ai' && playerColor === 'red' ? username :
                 mode === 'online' && playerColor === 'red' ? username :
                 mode === 'local' ? 'Red' :
                 opponentName || `AI (${difficulty})`}
              </span>
              {gameState.currentPlayer === 'red' && gameState.status === 'playing' && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-2 rounded-full bg-green-400"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar - empty for balance */}
        <div className="hidden lg:block lg:w-64 order-3" />
      </div>

      {/* Win screen */}
      <AnimatePresence>
        {showWin && gameState.status !== 'playing' && (
          <WinScreen
            winner={
              gameState.status === 'red_wins' ? 'red' :
              gameState.status === 'black_wins' ? 'black' :
              'draw'
            }
            playerColor={mode !== 'local' ? playerColor : undefined}
            onRestart={handleRestart}
            onMenu={onExit}
            analysisNotes={analysisNotes}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
