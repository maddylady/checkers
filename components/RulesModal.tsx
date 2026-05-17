'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { RulesVariant } from '@/lib/game-logic';

interface RulesModalProps {
  onClose: () => void;
  currentVariant: RulesVariant;
  onVariantChange: (v: RulesVariant) => void;
}

export default function RulesModal({ onClose, currentVariant, onVariantChange }: RulesModalProps) {
  const [tab, setTab] = useState<'rules' | 'variant'>('rules');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-white">Checkers Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-4">
          {([
            { id: 'rules', label: '📖 Rules' },
            { id: 'variant', label: '⚙️ Variant' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white/15 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <AnimatePresence mode="wait">
            {tab === 'rules' && (
              <motion.div
                key="rules"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-5"
              >
                {/* Objective */}
                <section>
                  <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wider text-amber-400">Objective</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Capture all of your opponent&apos;s pieces, or leave them with no legal moves. The player with no moves loses.
                  </p>
                </section>

                {/* Movement comparison */}
                <section>
                  <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider text-amber-400">Piece Movement</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-base font-bold text-white mb-2">🇺🇸 American Rules</div>
                      <ul className="space-y-2 text-xs text-gray-300">
                        <li className="flex gap-2">
                          <span className="text-amber-400 flex-shrink-0">→</span>
                          Regular pieces move <span className="text-white font-semibold mx-1">forward only</span> (1 square diagonally).
                        </li>
                        <li className="flex gap-2">
                          <span className="text-amber-400 flex-shrink-0">→</span>
                          Kings move <span className="text-white font-semibold mx-1">1 square</span> diagonally in any direction.
                        </li>
                        <li className="flex gap-2">
                          <span className="text-amber-400 flex-shrink-0">→</span>
                          Kings capture <span className="text-white font-semibold mx-1">1 step</span> over an enemy.
                        </li>
                        <li className="flex gap-2">
                          <span className="text-amber-400 flex-shrink-0">→</span>
                          Promotion mid-capture chain <span className="text-white font-semibold mx-1">ends the chain</span>.
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-base font-bold text-white mb-2">🇷🇺 Russian Rules</div>
                      <ul className="space-y-2 text-xs text-gray-300">
                        <li className="flex gap-2">
                          <span className="text-blue-400 flex-shrink-0">→</span>
                          Regular pieces move <span className="text-white font-semibold mx-1">forward only</span> (1 square diagonally).
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 flex-shrink-0">→</span>
                          Kings are <span className="text-white font-semibold mx-1">flying kings</span> — slide any number of squares diagonally.
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 flex-shrink-0">→</span>
                          Flying kings capture by jumping over an enemy and landing anywhere beyond it.
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 flex-shrink-0">→</span>
                          Promotion mid-chain <span className="text-white font-semibold mx-1">continues capturing</span> as a king.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Shared rules */}
                <section>
                  <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider text-amber-400">Shared Rules</h3>
                  <div className="space-y-2">
                    {[
                      {
                        icon: '💥',
                        title: 'Mandatory Capture',
                        text: 'If a capture is available you must take it. You cannot skip a capture.',
                      },
                      {
                        icon: '🔗',
                        title: 'Multi-Jump Chains',
                        text: 'After a capture, if the same piece can capture again it must continue in the same turn.',
                      },
                      {
                        icon: '👑',
                        title: 'King Promotion',
                        text: 'A piece reaching the opponent\'s back row is promoted to a king and gains enhanced movement.',
                      },
                      {
                        icon: '🤝',
                        title: 'Draw Rule',
                        text: '40 moves without a capture results in a draw.',
                      },
                    ].map(rule => (
                      <div key={rule.icon} className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <span className="text-xl flex-shrink-0">{rule.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{rule.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{rule.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {tab === 'variant' && (
              <motion.div
                key="variant"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <p className="text-gray-400 text-sm">
                  Choose which ruleset to use for all games. Your selection is saved automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* American card */}
                  <button
                    onClick={() => onVariantChange('american')}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      currentVariant === 'american'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-3">🇺🇸</div>
                    <div className="font-bold text-white text-base mb-1">American Checkers</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Classic English draughts. Kings move one square in any direction.
                      Promotion during a capture chain ends the turn.
                    </div>
                    {currentVariant === 'american' && (
                      <div className="mt-3 text-xs font-semibold text-amber-400">✓ Selected</div>
                    )}
                  </button>

                  {/* Russian card */}
                  <button
                    onClick={() => onVariantChange('russian')}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      currentVariant === 'russian'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-3">🇷🇺</div>
                    <div className="font-bold text-white text-base mb-1">Russian Checkers</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Flying kings slide any number of squares and capture at range.
                      A piece promoted mid-chain continues capturing as a king.
                    </div>
                    {currentVariant === 'russian' && (
                      <div className="mt-3 text-xs font-semibold text-blue-400">✓ Selected</div>
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center pt-2">
                  Changing the variant takes effect when you start your next game.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
