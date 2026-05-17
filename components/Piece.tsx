'use client';

import { motion } from 'framer-motion';
import type { Piece } from '@/lib/game-logic';
import { Crown } from 'lucide-react';
import { getActiveSkin, SKIN_PACKS } from '@/lib/skins';

interface PieceProps {
    piece: Piece;
    isSelected: boolean;
}

export default function PieceComponent({ piece, isSelected }: PieceProps) {
    const isRed = piece.player === 'red';
    const isKing = piece.type === 'king';

    const activeSkinId = getActiveSkin();
    const activeSkin = SKIN_PACKS.find(s => s.id === activeSkinId) ?? SKIN_PACKS[0];
    const isEmoji = activeSkinId !== 'classic';

    return (
        <motion.div
            layout
            layoutId={piece.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: isSelected ? 1.15 : 1,
                opacity: 1,
                y: isSelected ? -4 : 0,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
                layout: { type: 'spring', stiffness: 300, damping: 25 },
                scale: { type: 'spring', stiffness: 400, damping: 20 },
            }}
            className={`
        relative flex items-center justify-center
        rounded-full cursor-pointer
        w-[78%] h-[78%]
        ${isEmoji ? '' : `shadow-lg
        ${isRed
                ? 'bg-gradient-to-br from-red-400 to-red-700 border-2 border-red-300'
                : 'bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-500'
            }
        ${isSelected
                ? isRed
                    ? 'shadow-red-400/60 shadow-xl'
                    : 'shadow-gray-400/60 shadow-xl'
                : ''
            }`}
      `}
        >
            {isEmoji ? (
                <span className="text-3xl select-none">
          {isRed ? activeSkin.redPiece : activeSkin.blackPiece}
                    {isKing ? '👑' : ''}
        </span>
            ) : (
                <>
                    <div className={`
            absolute top-1 left-1 right-1 h-1/3 rounded-full opacity-40
            ${isRed ? 'bg-red-200' : 'bg-gray-400'}
          `} />
                    {isKing && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10">
                            <Crown
                                size={16}
                                className={`${isRed ? 'text-yellow-300' : 'text-yellow-400'} drop-shadow-sm`}
                                fill="currentColor"
                            />
                        </motion.div>
                    )}
                </>
            )}

            {isSelected && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-yellow-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                />
            )}
        </motion.div>
    );
}