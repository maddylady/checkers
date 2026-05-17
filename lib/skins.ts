export interface SkinPack {
    id: string;
    name: string;
    redPiece: string;
    blackPiece: string;
    price: number; // 0 = free
    unlockCondition?: string; // e.g. "7-day streak"
}

export const SKIN_PACKS: SkinPack[] = [
    { id: 'classic',   name: 'Classic',         redPiece: '🔴', blackPiece: '⚫', price: 0 },
    { id: 'cats_dogs', name: 'Cats vs Dogs',     redPiece: '🐱', blackPiece: '🐶', price: 150 },
    { id: 'space',     name: 'Space',            redPiece: '🚀', blackPiece: '👽', price: 200 },
    { id: 'kz',        name: 'Kazakhstan',       redPiece: '🦅', blackPiece: '🏕️', price: 0, unlockCondition: '7-day streak' },
    { id: 'pacman',    name: 'Pac-Man',          redPiece: '👾', blackPiece: '👻', price: 300 },
];

export function getOwnedSkins(): string[] {
    try {
        return JSON.parse(localStorage.getItem('owned_skins') || '["classic"]');
    } catch { return ['classic']; }
}

export function getActiveSkin(): string {
    return localStorage.getItem('active_skin') || 'classic';
}

export function setActiveSkin(id: string) {
    localStorage.setItem('active_skin', id);
}

export function purchaseSkin(id: string, cost: number): boolean {
    const coins = parseInt(localStorage.getItem('coins') || '0');
    if (coins < cost) return false;
    localStorage.setItem('coins', String(coins - cost));
    const owned = getOwnedSkins();
    if (!owned.includes(id)) {
        owned.push(id);
        localStorage.setItem('owned_skins', JSON.stringify(owned));
    }
    return true;
}