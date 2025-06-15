export const gainXP = (amount) => ({
    type: 'GAIN_XP',
    payload: amount,
});

export const unlockBadge = (badgeId) => ({
    type: 'UNLOCK_BADGE',
    payload: badgeId,
});

export const resetGamification = () => ({
    type: 'RESET_GAMIFICATION',
});
