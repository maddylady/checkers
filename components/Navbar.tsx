'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap, Crown, X, Check, LogOut, ShoppingBag, User, BookOpen } from 'lucide-react';
import { setPro } from '@/lib/storage';
import { signInWithGoogle, signOut, type AuthUser } from '@/lib/supabase';

interface NavbarProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  username: string;
  onUsernameChange: () => void;
  googleUser: AuthUser | null;
  coins?: number;
  onShopOpen: () => void;
  onLogoClick?: () => void;
  onProfileOpen?: () => void;
  onRulesOpen?: () => void;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function ProModal({ onClose }: { onClose: () => void }) {
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
        className="relative bg-gradient-to-br from-gray-900 via-purple-950/30 to-gray-900 rounded-3xl border border-purple-500/30 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
          <X size={20} />
        </button>
        <div className="overflow-y-auto p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-amber-500 rounded-2xl">
              <Crown size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">CheckMate Pro</h2>
          <p className="text-gray-400">Unlock your full potential</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-amber-900/20 rounded-2xl p-6 mb-6 border border-purple-500/20">
          <div className="flex items-end gap-2 justify-center mb-2">
            <span className="text-5xl font-bold text-white">$9</span>
            <span className="text-gray-400 mb-2">.99/month</span>
          </div>
          <div className="text-center text-sm text-purple-300">or $79.99/year (save 33%)</div>
        </div>
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
            ) : 'Upgrade Now →'}
          </motion.button>
        )}
        <p className="text-center text-xs text-gray-500 mt-3">Cancel anytime • Secure payment via Stripe</p>
        </div>{/* end scrollable */}
      </motion.div>
    </motion.div>
  );
}

export default function Navbar({ theme, onThemeToggle, username, onUsernameChange, googleUser, coins, onShopOpen, onLogoClick, onProfileOpen, onRulesOpen }: NavbarProps) {
  const [showPro, setShowPro] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 backdrop-blur-md bg-black/30 border-b border-white/10">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-red-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">♟</span>
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">
            CheckMate <span className="text-amber-400">Arena</span>
          </span>
        </button>

        {/* Center */}
        <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
          <Zap size={12} className="text-amber-400" />
          <span>Real-time multiplayer strategy</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Username + profile (only show if not signed in with Google) */}
          {!googleUser?.isGoogle && username && (
            <button
              onClick={onProfileOpen}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-gray-300"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-xs text-white font-bold">
                {username[0].toUpperCase()}
              </div>
              <span>{username}</span>
            </button>
          )}
          {!googleUser?.isGoogle && !username && (
            <button
              onClick={onUsernameChange}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-gray-300"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-xs text-white font-bold">?</div>
              <span>Set name</span>
            </button>
          )}

          {/* Google user or Sign in button */}
          {googleUser?.isGoogle ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
              >
                {googleUser.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={googleUser.avatar} alt="avatar" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {googleUser.name?.[0]?.toUpperCase() ?? 'G'}
                  </div>
                )}
                <span className="hidden sm:block max-w-24 truncate">{googleUser.name ?? 'Google user'}</span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-10 bg-gray-900 border border-white/10 rounded-2xl p-2 shadow-2xl w-48 z-50"
                  >
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10 mb-1">
                      Signed in with Google
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); onProfileOpen?.(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <User size={14} />
                      My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-gray-800 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              <GoogleIcon />
              {signingIn ? 'Redirecting...' : 'Sign in'}
            </motion.button>
          )}

          {/* Coins badge */}
          {coins !== undefined && (
            <div className="group relative flex items-center gap-1 px-2 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 cursor-default">
              <span className="text-amber-400 text-sm">🪙</span>
              <span className="text-amber-400 text-xs font-bold">{coins}</span>
              <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 border border-white/10 rounded-xl text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <div className="font-semibold text-white mb-1">🪙 Coins</div>
                <div>Win games &amp; complete daily challenges to earn coins.</div>
                <div className="text-gray-400 mt-0.5">Spend them in the Shop on piece skins!</div>
              </div>
            </div>
          )}

          {/* Rules button */}
          <button
            onClick={onRulesOpen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-gray-300"
            title="Rules"
          >
            <BookOpen size={16} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-gray-300"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Shop button */}
          <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShopOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
          >
            <ShoppingBag size={14} />
            <span className="hidden sm:block">Shop</span>
          </motion.button>

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

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-[35]" onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
}
