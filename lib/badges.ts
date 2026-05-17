export type BadgeId =
    | 'first_blood'
    | 'on_fire'
    | 'pacifist'
    | 'speed_demon'
    | 'mine_sweeper'
    | 'lucky_devil'
    | 'veteran'
    | 'comeback_king';

export interface Badge {
    id: BadgeId;
    emoji: string;
    title: string;
    desc: string;
}

export const BADGES: Record<BadgeId, Badge> = {
    first_blood:   { id: 'first_blood',   emoji: '⚔️',  title: 'First Blood',    desc: 'Win your first game' },
    on_fire:       { id: 'on_fire',       emoji: '🔥',  title: 'On Fire',         desc: '3-day streak' },
    pacifist:      { id: 'pacifist',      emoji: '🕊️', title: 'Pacifist',        desc: 'Win without losing a piece' },
    speed_demon:   { id: 'speed_demon',   emoji: '⚡',  title: 'Speed Demon',     desc: 'Win in under 15 moves' },
    mine_sweeper:  { id: 'mine_sweeper',  emoji: '💣',  title: 'Mine Sweeper',    desc: 'Win Mines mode 3 times' },
    lucky_devil:   { id: 'lucky_devil',   emoji: '🎰',  title: 'Lucky Devil',     desc: 'Win Roulette mode' },
    veteran:       { id: 'veteran',       emoji: '🎖️', title: 'Veteran',         desc: 'Play 25 games' },
    comeback_king: { id: 'comeback_king', emoji: '👑',  title: 'Comeback King',   desc: 'Win with 2x fewer pieces' },
};

export function getEarnedBadges(): BadgeId[] {
    try {
        return JSON.parse(localStorage.getItem('badges') || '[]');
    } catch { return []; }
}

export function awardBadge(id: BadgeId): boolean {
    const earned = getEarnedBadges();
    if (earned.includes(id)) return false;
    earned.push(id);
    localStorage.setItem('badges', JSON.stringify(earned));
    return true;
}