'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Badge } from '@/lib/badges';

interface Props {
    badge: Badge | null;
    onClose: () => void;
}

export default function BadgeUnlockModal({ badge, onClose }: Props) {
    return (
        <AnimatePresence>
            {badge && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ scale: 0.5, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-amber-500/30 shadow-2xl text-center max-w-xs w-full"
                    >
                        <div className="text-7xl mb-4">{badge.emoji}</div>
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
                            Badge Unlocked!
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{badge.title}</h3>
                        <p className="text-gray-400 text-sm mb-6">{badge.desc}</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-colors"
                        >
                            Nice!
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}