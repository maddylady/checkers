'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap, Crown, X, Check } from 'lucide-react';
import { setPro, isPro } from '@/lib/storage';

interface NavbarProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  username: string;
  onUsernameChange: () => void;
}

function ProModal({ onClose }: { onClose: () => void }) {
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const handlePurchase = () => {
    setPurchasing(true);
    setTimeout(() => {
      setPurchasing(false);
      setPurchased(true);
      setPro(true);
      setTimeout(onClose, 2000);
    }, 2000);
  };

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
        className="relative bg-gradient-to-br from-gray-900 via-purple-950/30 to-gray-900 rounded-3xl p-8 border border-purple-500/30 shadow-2xl max-w-md w-full"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-amber-500 rounded-2xl">
              <Crown size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">CheckMate Pro</h2>
          <p className="text-gray-400">Unlock your full potential</p>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-purple-900/40 to-amber-900/20 rounded-2xl p-6 mb-6 border border-purple-500/20">
          <div className="flex items-end gap-2 justify-center mb-2">
            <span className="text-5xl font-bold text-white">$9</span>
            <span className="text-gray-400 mb-2">.99/month</span>
          </div>
          <div className="text-center text-sm text-purple-300">or $79.99/year (save 33%)</div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {[
            { icon: '🎨', text: 'Custom piece skins & board themes' },
            { icon: '🧠', text: 'Advanced AI analysis with move scoring' },
            { icon: '📊', text: 'Detailed game statistics & heatmaps' },
            { icon: '🌐', text: 'Private online rooms & tournaments' },
            { icon: '👑', text: 'Pro badge on leaderboard' },
            { icon: '⚡', text: 'Unlimited game history' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>{f.icon}</span>
              </div>
              <span className="text-gray-300 text-sm">{f.text}</span>
              <Check size={14} className="text-green-400 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* CTA */}
        {purchased ? (
          <div className="flex items-center justify-center gap-2 py-4 bg-green-500/20 rounded-2xl border border-green-500/30 text-green-400 font-semibold">
            <Check size={20} />
            Welcome to Pro! Enjoy!
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold rounded-2xl transition-all text-lg disabled:opacity-70"
          >
            {purchasing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Upgrade Now →'
            )}
          </motion.button>
        )}

        <p className="text-center text-xs text-gray-500 mt-3">
          Cancel anytime • Secure payment via Stripe
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function Navbar({ theme, onThemeToggle, username, onUsernameChange }: NavbarProps) {
  const [showPro, setShowPro] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 backdrop-blur-md bg-black/30 border-b border-white/10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-red-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">♟</span>
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">
            CheckMate <span className="text-amber-400">Arena</span>
          </span>
        </div>

        {/* Center */}
        <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
          <Zap size={12} className="text-amber-400" />
          <span>Real-time multiplayer strategy</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Username */}
          <button
            onClick={onUsernameChange}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-gray-300"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-xs text-white font-bold">
              {username ? username[0].toUpperCase() : '?'}
            </div>
            <span>{username || 'Set name'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-gray-300"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Pro button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPro(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 text-white text-sm font-semibold"
          >
            <Crown size={14} />
            <span className="hidden sm:block">Upgrade Pro</span>
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {showPro && <ProModal onClose={() => setShowPro(false)} />}
      </AnimatePresence>
    </>
  );
}
