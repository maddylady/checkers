'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lesson {
  icon: string;
  title: string;
  desc: string;
  tips: string[];
}

const LESSONS: Lesson[] = [
  {
    icon: '📖',
    title: 'The Basics',
    desc: 'How pieces move and capture',
    tips: [
      'Pieces move diagonally forward on dark squares only.',
      "To capture, jump over an opponent's piece to an empty square behind it.",
      "If a capture is available, you MUST take it — you can't skip.",
      'After a capture, if another capture is possible with the same piece, you must continue jumping.',
    ],
  },
  {
    icon: '👑',
    title: 'Kings Are Powerful',
    desc: 'Reach the back row to promote',
    tips: [
      "When your piece reaches the opponent's back row, it becomes a King.",
      'Kings can move AND capture in all 4 diagonal directions.',
      'Protect your kings — losing one is a big setback.',
      'Try to promote pieces while preventing your opponent from doing the same.',
    ],
  },
  {
    icon: '🎯',
    title: 'Control the Center',
    desc: 'Board position matters',
    tips: [
      'Pieces in the center control more squares and have more move options.',
      'Edge pieces are less flexible — avoid parking pieces on the sides.',
      'Try to occupy the 4 central squares early in the game.',
      "A strong center puts pressure on your opponent's formation.",
    ],
  },
  {
    icon: '🔗',
    title: 'Multi-Jump Tactics',
    desc: 'Chain captures to dominate',
    tips: [
      'Look for sequences where one piece can capture multiple opponents in one turn.',
      "Set up your pieces so the opponent is forced into a position where you can chain-jump.",
      "Sacrifice a piece to create a multi-jump opportunity — it's often worth it.",
      'Always check the full board for chain capture possibilities before moving.',
    ],
  },
  {
    icon: '⚔️',
    title: 'Trading & Tempo',
    desc: 'When to exchange pieces',
    tips: [
      "If you're ahead in pieces, trade freely — it increases your advantage.",
      "If you're behind, avoid trading — keep as many pieces as possible.",
      'Forcing the opponent to capture can sometimes give you tempo (extra initiative).',
      'A forced trade that gives you a king is almost always a good deal.',
    ],
  },
  {
    icon: '🏁',
    title: 'Endgame Principles',
    desc: 'How to convert a winning position',
    tips: [
      'In the endgame, kings are decisive — centralize them.',
      "Don't let your opponent's piece reach your back row.",
      "With more pieces, keep advancing and restricting opponent's moves.",
      'Two kings vs one king — use the triangle maneuver to trap and capture.',
    ],
  },
];

export default function CoachPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <div className="rounded-2xl border bg-white border-gray-200 dark:bg-white/5 dark:border-white/10 overflow-hidden">
      {/* Banner */}
      <div className="px-4 pt-4 pb-3 border-b border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
        <div className="text-base font-bold text-amber-700 dark:text-amber-400">🤖 AI Coach</div>
        <div className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Learn tactics to improve your game</div>
      </div>

      {/* Lesson list */}
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {LESSONS.map((lesson, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={lesson.title}
              className={`transition-colors ${isOpen ? 'border-l-2 border-amber-400' : 'border-l-2 border-transparent'}`}
            >
              {/* Header */}
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-xl flex-shrink-0">{lesson.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{lesson.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{lesson.desc}</div>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500 text-sm"
                >
                  ▾
                </motion.span>
              </button>

              {/* Tips */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <ul className="px-4 pb-3 pt-1 space-y-2">
                      {lesson.tips.map((tip, j) => (
                        <li key={j} className="flex gap-2 items-start">
                          <span className="mt-1 text-amber-400 text-[10px] flex-shrink-0">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
