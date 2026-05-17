'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SKIN_PACKS, getOwnedSkins, getActiveSkin, setActiveSkin, purchaseSkin } from '@/lib/skins';
import { getCoins } from '@/lib/storage';
import { getStreak } from '@/lib/storage';

interface Props {
    onClose: () => void;
    onCoinsChange: () => void;
}

export default function SkinShop({ onClose, onCoinsChange }: Props) {
    const [owned, setOwned] = useState<string[]>([]);
    const [active, setActive] = useState<string>('classic');
    const [coins, setCoins] = useState(0);
    const [streak, setStreakState] = useState(0);

    useEffect(() => {
        setOwned(getOwnedSkins());
        setActive(getActiveSkin());
        setCoins(getCoins());
        setStreakState(getStreak().count);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleBuy = (id: string, price: number) => {
        if (purchaseSkin(id, price)) {
            setOwned(getOwnedSkins());
            setCoins(getCoins());
            onCoinsChange();
        }
    };

    const handleEquip = (id: string) => {
        setActiveSkin(id);
        setActive(id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎨 Skin Shop</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-amber-400">🪙 {coins}</span>
                        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ml-3">✕</button>
                    </div>
                </div>

                <div className="space-y-3">
                    {SKIN_PACKS.map(skin => {
                        const isOwned = owned.includes(skin.id);
                        const isActive = active === skin.id;
                        const isLocked = !isOwned && skin.unlockCondition;
                        const streakUnlock = skin.unlockCondition?.includes('7-day') && streak >= 7;

                        return (
                            <div
                                key={skin.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                    isActive
                                        ? 'border-amber-500/50 bg-amber-500/10'
                                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                                }`}
                            >
                                <div className="text-3xl">{skin.redPiece}</div>
                                <div className="text-3xl">{skin.blackPiece}</div>
                                <div className="flex-1">
                                    <div className="text-gray-900 dark:text-white font-semibold">{skin.name}</div>
                                    {skin.unlockCondition && (
                                        <div className="text-xs text-gray-500 dark:text-gray-500">{skin.unlockCondition}</div>
                                    )}
                                </div>
                                {isActive ? (
                                    <span className="text-amber-400 text-xs font-bold">ACTIVE</span>
                                ) : isOwned ? (
                                    <button
                                        onClick={() => handleEquip(skin.id)}
                                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-lg"
                                    >
                                        Equip
                                    </button>
                                ) : isLocked && !streakUnlock ? (
                                    <span className="text-gray-500 text-xs">🔒 {skin.unlockCondition}</span>
                                ) : coins >= skin.price ? (
                                    <button
                                        onClick={() => handleBuy(skin.id, skin.price)}
                                        className="px-3 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg"
                                    >
                                        🪙 {skin.price}
                                    </button>
                                ) : (
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 line-through">🪙 {skin.price}</div>
                                        <div className="text-[10px] text-red-400">need {skin.price - coins} more</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}