'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  type GameState,
  type Player,
  type Move,
  type AnalysisNote,
} from '@/lib/game-logic';
import { getBestMove, type Difficulty } from '@/lib/ai';
import { recordGameResult } from '@/lib/storage';
import type { GameMode } from './ModeSelector';
import { ArrowLeft, Copy, Check as CheckIcon } from 'lucide-react';

// Socket.io client (lazy import to avoid SSR issues)
let socket: ReturnType<typeof import('socket.io-client').io> | null = null;

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
  const [thinking, setThinking] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState<AnalysisNote[]>([]);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [copied, setCopied] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<'connecting' | 'waiting' | 'playing' | 'error'>('connecting');
  const [opponentName, setOpponentName] = useState<string>('');

  const gameStartTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  // ---- Timer ----
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    setTurnTimer(30);
    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          // Time's up — make a random move
          const moves = getAllValidMoves(gameStateRef.current.board, gameStateRef.current.currentPlayer);
          if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            handleMove(randomMove);
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.status]);

  // ---- AI move ----
  useEffect(() => {
    if (mode !== 'ai') return;
    if (gameState.status !== 'playing') return;
    if (gameState.currentPlayer === playerColor) return; // human's turn

    const aiPlayer: Player = playerColor === 'red' ? 'black' : 'red';
    setThinking(true);

    const timer = setTimeout(() => {
      const best = getBestMove(gameState.board, aiPlayer, difficulty);
      setThinking(false);
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

      // Run analysis
      const notes = analyzeGame(gameState.moveHistory, gameState.board);
      setAnalysisNotes(notes);

      // Record result
      {
        const duration = Math.floor((Date.now() - gameStartTime.current) / 1000);
        let result: 'win' | 'loss' | 'draw' = 'draw';
        if (gameState.status === 'red_wins') {
          result = playerColor === 'red' ? 'win' : 'loss';
        } else if (gameState.status === 'black_wins') {
          result = playerColor === 'black' ? 'win' : 'loss';
        }
        const opp = mode === 'ai' ? `AI (${difficulty})` : opponentName || 'Player 2';
        recordGameResult(result, mode, opp, gameState.moveHistory.length, duration);
      }

      // Short delay then show win screen
      const t = setTimeout(() => setShowWin(true), 500);
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
        socket = io(window.location.origin, { path: '/api/socket' });

        socket.on('connect', () => {
          socket?.emit('join-room', { roomCode, username });
        });

        socket.on('room-joined', (data: { color: Player; opponentName?: string }) => {
          setPlayerColor(data.color);
          if (data.opponentName) {
            setOpponentName(data.opponentName);
            setOnlineStatus('playing');
          } else {
            setOnlineStatus('waiting');
          }
        });

        socket.on('opponent-joined', (data: { username: string }) => {
          setOpponentName(data.username);
          setOnlineStatus('playing');
        });

        socket.on('move-made', (move: Move) => {
          setGameState(prev => applyMoveToState(prev, move));
        });

        socket.on('opponent-disconnected', () => {
          setOnlineStatus('error');
        });

        socket.on('connect_error', () => {
          setOnlineStatus('error');
        });
      } catch {
        setOnlineStatus('error');
      }
    }

    setupSocket();
    return () => {
      socket?.disconnect();
      socket = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roomCode]);

  // ---- Move handler ----
  const handleMove = useCallback((move: Move) => {
    if (mode === 'online' && socket) {
      socket.emit('make-move', { roomCode, move });
    }
    setGameState(prev => applyMoveToState(prev, move));
  }, [mode, roomCode]);

  // ---- Cell click ----
  const handleCellClick = useCallback((row: number, col: number) => {
    const state = gameStateRef.current;
    if (state.status !== 'playing') return;

    // Online: only move on your turn
    if (mode === 'online' && state.currentPlayer !== playerColor) return;
    // AI: only move on player's turn
    if (mode === 'ai' && state.currentPlayer !== playerColor) return;

    const clickedPiece = state.board[row][col];

    // If a cell is already selected
    if (state.selectedCell) {
      const [selRow, selCol] = state.selectedCell;

      // Check if clicked cell is a valid move target
      const movesFromSelected = getMovesForCell(state.validMoves, selRow, selCol);
      const matchingMove = movesFromSelected.find(
        m => m.to[0] === row && m.to[1] === col
      );

      if (matchingMove) {
        handleMove(matchingMove);
        return;
      }

      // Clicked on own piece — re-select
      if (clickedPiece?.player === state.currentPlayer) {
        const pieceMoves = getMovesForCell(state.validMoves, row, col);
        if (pieceMoves.length > 0) {
          setGameState(prev => ({
            ...prev,
            selectedCell: [row, col],
          }));
          return;
        }
      }

      // Deselect
      setGameState(prev => ({ ...prev, selectedCell: null }));
      return;
    }

    // No selection: select a piece
    if (clickedPiece?.player === state.currentPlayer) {
      const pieceMoves = getMovesForCell(state.validMoves, row, col);
      if (pieceMoves.length > 0) {
        setGameState(prev => ({
          ...prev,
          selectedCell: [row, col],
        }));
      }
    }
  }, [mode, playerColor, handleMove]);

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState(createInitialGameState());
    setShowWin(false);
    setThinking(false);
    gameStartTime.current = Date.now();
  }, []);

  const handleResign = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: prev.currentPlayer === 'red' ? 'black_wins' : 'red_wins',
    }));
  }, []);

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
