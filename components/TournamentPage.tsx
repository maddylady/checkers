'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

interface TournamentPageProps {
  onExit: () => void;
  username: string;
}

type Step = 'setup' | 'bracket' | 'champion';

interface Results {
  semi1: string | null;
  semi2: string | null;
  final: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PLAYER_GRADIENTS = [
  'from-amber-500 to-orange-400',   // P1 — amber
  'from-blue-500 to-indigo-400',    // P2 — blue
  'from-green-500 to-emerald-400',  // P3 — green
  'from-purple-500 to-violet-400',  // P4 — purple
] as const;

const PLAYER_BADGE_GRADIENTS = [
  'from-amber-600 to-orange-500',
  'from-blue-600 to-indigo-500',
  'from-green-600 to-emerald-500',
  'from-purple-600 to-violet-500',
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, gradient, size = 'md' }: { name: string; gradient: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-14 h-14 text-xl',
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

// ── Confetti dots ─────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  'bg-amber-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400',
  'bg-pink-400', 'bg-red-400', 'bg-cyan-400', 'bg-yellow-400',
];

// Pre-computed so Math.random() is never called during render
const CONFETTI_DATA = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 3.7 + 2) % 96}%`,
  delay: (i * 0.09) % 1.2,
  duration: 2.5 + (i % 5) * 0.4,
  size: 6 + (i % 5) * 2,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  yEnd: -(380 + (i % 6) * 40),
  xStart: ((i % 5) - 2) * 40,
  xEnd: ((i % 7) - 3) * 30,
  rotate: i % 2 === 0 ? 360 : -360,
}));

interface ConfettiDotProps {
  left: string; delay: number; duration: number; size: number;
  color: string; yEnd: number; xStart: number; xEnd: number; rotate: number;
}

function ConfettiDot({ left, delay, duration, size, color, yEnd, xStart, xEnd, rotate }: ConfettiDotProps) {
  return (
    <motion.div
      className={`absolute rounded-full ${color} opacity-80`}
      style={{ left, bottom: '-20px', width: size, height: size }}
      animate={{
        y: [0, yEnd],
        x: [xStart, xEnd],
        opacity: [0, 1, 1, 0],
        rotate: [0, rotate],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

// ── Match card ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  label: string;
  p1: string | null;
  p2: string | null;
  p1Gradient: string;
  p2Gradient: string;
  winner: string | null;
  locked: boolean;
  onWin: (winner: string) => void;
}

function MatchCard({ label, p1, p2, p1Gradient, p2Gradient, winner, locked, onWin }: MatchCardProps) {
  const bothKnown = p1 && p2;
  const isPlayable = bothKnown && !winner && !locked;

  const playerRow = (
    name: string | null,
    gradient: string,
    isWinner: boolean,
    isLoser: boolean,
    btnLabel: string,
    onClickWin: () => void,
  ) => (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
        isWinner
          ? 'bg-green-500/15 border border-green-500/40'
          : isLoser
          ? 'bg-red-500/10 border border-red-500/20 opacity-60'
          : 'border border-transparent'
      }`}
    >
      <Avatar name={name || '?'} gradient={gradient} size="sm" />
      <span
        className={`flex-1 font-semibold text-sm truncate ${
          isWinner
            ? 'text-green-400'
            : isLoser
            ? 'text-gray-400 dark:text-gray-500 line-through'
            : name
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-gray-600 italic'
        }`}
      >
        {name || 'TBD'}
      </span>
      {isWinner && <span className="text-green-400 text-xs font-bold">Winner</span>}
      {isPlayable && name && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClickWin}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex-shrink-0 shadow"
        >
          {btnLabel}
        </motion.button>
      )}
    </div>
  );

  return (
    <div
      className={`rounded-2xl border p-1.5 transition-all ${
        locked && !winner
          ? 'border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] opacity-60'
          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 pt-1 pb-1.5">
        {label}
      </div>
      <div className="space-y-1">
        {playerRow(p1, p1Gradient, winner === p1, winner !== null && winner !== p1, 'P1 won', () => p1 && onWin(p1))}
        <div className="flex items-center gap-2 px-3">
          <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">vs</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
        </div>
        {playerRow(p2, p2Gradient, winner === p2, winner !== null && winner !== p2, 'P2 won', () => p2 && onWin(p2))}
      </div>
      {locked && !winner && (
        <div className="text-center py-1.5 text-[10px] text-gray-400 dark:text-gray-500 italic">
          Waiting for semi-finals…
        </div>
      )}
    </div>
  );
}

// ── Bracket connector line ────────────────────────────────────────────────────

// Uses a CSS-only approach: a vertical bar on the right side of each semi,
// connected by a horizontal bar to the final card.

function BracketLines() {
  return (
    // Absolutely positioned overlay covering the gap between semis and final.
    // The parent bracket container uses relative positioning.
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {/* Top arm: from center of semi1 → middle */}
      <div
        className="absolute border-r-2 border-t-2 border-gray-200 dark:border-white/15 rounded-tr-lg"
        style={{ top: '25%', right: 0, width: '50%', height: '25%' }}
      />
      {/* Bottom arm: from center of semi2 → middle */}
      <div
        className="absolute border-r-2 border-b-2 border-gray-200 dark:border-white/15 rounded-br-lg"
        style={{ bottom: '25%', right: 0, width: '50%', height: '25%' }}
      />
    </div>
  );
}

// ── Step 1: Setup ─────────────────────────────────────────────────────────────

interface SetupStepProps {
  players: string[];
  onPlayersChange: (players: string[]) => void;
  onStart: () => void;
  onExit: () => void;
}

function SetupStep({ players, onPlayersChange, onStart, onExit }: SetupStepProps) {
  const canStart = players.every(p => p.trim().length > 0);

  const update = (i: number, value: string) => {
    const next = [...players];
    next[i] = value;
    onPlayersChange(next);
  };

  const labels = ['P1', 'P2', 'P3', 'P4'];
  const placeholders = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-3xl mb-4 shadow-lg">
          🏆
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tournament</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">4-player single elimination</p>
      </div>

      {/* Player inputs */}
      <div className="space-y-3">
        {labels.map((label, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {/* Badge */}
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAYER_BADGE_GRADIENTS[i]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow`}
            >
              {label}
            </div>
            {/* Input */}
            <input
              type="text"
              value={players[i]}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholders[i]}
              maxLength={24}
              className="flex-1 px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors text-sm font-medium"
            />
          </motion.div>
        ))}
      </div>

      {/* Bracket preview hint */}
      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Bracket preview</div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${PLAYER_BADGE_GRADIENTS[0]} text-white font-bold text-[10px]`}>P1</span>
          <span>vs</span>
          <span className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${PLAYER_BADGE_GRADIENTS[1]} text-white font-bold text-[10px]`}>P2</span>
          <span className="ml-auto text-gray-400 dark:text-gray-500">Semi-final 1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${PLAYER_BADGE_GRADIENTS[2]} text-white font-bold text-[10px]`}>P3</span>
          <span>vs</span>
          <span className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${PLAYER_BADGE_GRADIENTS[3]} text-white font-bold text-[10px]`}>P4</span>
          <span className="ml-auto text-gray-400 dark:text-gray-500">Semi-final 2</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold">Winner 1</span>
          <span>vs</span>
          <span className="text-amber-500 font-bold">Winner 2</span>
          <span className="ml-auto text-gray-400 dark:text-gray-500">Final</span>
        </div>
      </div>

      {/* Buttons */}
      <motion.button
        whileHover={{ scale: canStart ? 1.02 : 1 }}
        whileTap={{ scale: canStart ? 0.97 : 1 }}
        disabled={!canStart}
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 text-white font-bold rounded-2xl text-base transition-all shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
      >
        Start Tournament →
      </motion.button>

      <button
        onClick={onExit}
        className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
      >
        ← Back
      </button>
    </motion.div>
  );
}

// ── Step 2: Bracket ───────────────────────────────────────────────────────────

interface BracketStepProps {
  players: string[];
  results: Results;
  onResult: (match: keyof Results, winner: string) => void;
}

function BracketStep({ players, results, onResult }: BracketStepProps) {
  const semi1Done = results.semi1 !== null;
  const semi2Done = results.semi2 !== null;
  const semisComplete = semi1Done && semi2Done;
  const doneCount = (semi1Done ? 1 : 0) + (semi2Done ? 1 : 0) + (results.final !== null ? 1 : 0);

  // Determine gradient indices for final players
  const finalP1 = results.semi1;
  const finalP2 = results.semi2;

  // Map a player name back to their original index (0-3) for gradient lookup
  const gradientFor = (name: string | null): string => {
    if (!name) return PLAYER_GRADIENTS[0];
    const idx = players.indexOf(name);
    return idx >= 0 ? PLAYER_GRADIENTS[idx] : PLAYER_GRADIENTS[0];
  };

  return (
    <motion.div
      key="bracket"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bracket</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {!semisComplete ? 'Semi-finals' : results.final ? 'Final' : 'Final'}
          {' · '}
          <span className="font-semibold text-amber-500">{doneCount}/3 complete</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round((doneCount / 3) * 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Bracket layout */}
      <div className="flex gap-0 items-stretch min-h-[320px]">

        {/* Left column: semi-finals */}
        <div className="flex-1 flex flex-col gap-4 relative">
          <MatchCard
            label="Semi-final 1"
            p1={players[0]}
            p2={players[1]}
            p1Gradient={PLAYER_GRADIENTS[0]}
            p2Gradient={PLAYER_GRADIENTS[1]}
            winner={results.semi1}
            locked={false}
            onWin={w => onResult('semi1', w)}
          />
          <MatchCard
            label="Semi-final 2"
            p1={players[2]}
            p2={players[3]}
            p1Gradient={PLAYER_GRADIENTS[2]}
            p2Gradient={PLAYER_GRADIENTS[3]}
            winner={results.semi2}
            locked={false}
            onWin={w => onResult('semi2', w)}
          />

          {/* Bracket arm lines (right side of left column) */}
          <BracketLines />
        </div>

        {/* Spacer between semis and final */}
        <div className="w-8 flex-shrink-0" />

        {/* Right column: final (centered vertically) */}
        <div className="flex-1 flex flex-col justify-center">
          <MatchCard
            label="Final"
            p1={finalP1}
            p2={finalP2}
            p1Gradient={gradientFor(finalP1)}
            p2Gradient={gradientFor(finalP2)}
            winner={results.final}
            locked={!semisComplete}
            onWin={w => onResult('final', w)}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Winner
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Eliminated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 inline-block" /> TBD
        </span>
      </div>
    </motion.div>
  );
}

// ── Step 3: Champion ──────────────────────────────────────────────────────────

interface ChampionStepProps {
  champion: string;
  championGradient: string;
  onPlayAgain: () => void;
  onNewTournament: () => void;
  onExit: () => void;
}

function ChampionStep({ champion, championGradient, onPlayAgain, onNewTournament, onExit }: ChampionStepProps) {
  return (
    <motion.div
      key="champion"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-center space-y-6 relative"
    >
      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {CONFETTI_DATA.map((dot, i) => (
          <ConfettiDot key={i} {...dot} />
        ))}
      </div>

      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 16 }}
        className="text-7xl leading-none select-none"
      >
        🏆
      </motion.div>

      {/* Champion label */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-2">Champion!</p>
        <h2
          className={`text-4xl font-extrabold bg-gradient-to-r ${championGradient} bg-clip-text text-transparent leading-tight pb-1`}
        >
          {champion}
        </h2>
      </motion.div>

      {/* Decorative winner badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
      >
        <span className="text-amber-500 text-lg">★</span>
        <span className="text-amber-400 font-bold text-sm">Tournament Winner</span>
        <span className="text-amber-500 text-lg">★</span>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="space-y-3 pt-2"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayAgain}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-2xl text-base transition-all shadow-lg"
        >
          Play Again (same players)
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewTournament}
          className="w-full py-3.5 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white font-semibold rounded-2xl text-base transition-all"
        >
          New Tournament
        </motion.button>

        <button
          onClick={onExit}
          className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
        >
          ← Back to Home
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function TournamentPage({ onExit, username }: TournamentPageProps) {
  const initialPlayers = [username || '', '', '', ''];

  const [step, setStep] = useState<Step>('setup');
  const [players, setPlayers] = useState<string[]>(initialPlayers);
  const [results, setResults] = useState<Results>({ semi1: null, semi2: null, final: null });

  const handleStart = () => {
    setResults({ semi1: null, semi2: null, final: null });
    setStep('bracket');
  };

  const handleResult = (match: keyof Results, winner: string) => {
    setResults(prev => {
      const next = { ...prev, [match]: winner };
      // If final is now set, advance to champion screen
      if (match === 'final') {
        // Schedule step change after state update
        setTimeout(() => setStep('champion'), 350);
      }
      return next;
    });
  };

  const handlePlayAgain = () => {
    setResults({ semi1: null, semi2: null, final: null });
    setStep('bracket');
  };

  const handleNewTournament = () => {
    setPlayers(initialPlayers);
    setResults({ semi1: null, semi2: null, final: null });
    setStep('setup');
  };

  // Derive champion gradient from original player index
  const champion = results.final ?? '';
  const championIdx = players.indexOf(champion);
  const championGradient = championIdx >= 0 ? PLAYER_GRADIENTS[championIdx] : PLAYER_GRADIENTS[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Card wrapper */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl p-6 sm:p-8 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <SetupStep
                key="setup"
                players={players}
                onPlayersChange={setPlayers}
                onStart={handleStart}
                onExit={onExit}
              />
            )}

            {step === 'bracket' && (
              <BracketStep
                key="bracket"
                players={players}
                results={results}
                onResult={handleResult}
              />
            )}

            {step === 'champion' && (
              <ChampionStep
                key="champion"
                champion={champion}
                championGradient={championGradient}
                onPlayAgain={handlePlayAgain}
                onNewTournament={handleNewTournament}
                onExit={onExit}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
