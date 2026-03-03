import type { RoomState } from "react-game-ui";

/**
 * 指定された色の最多出展者を計算する
 * @param state - ルームの状態
 * @param deckId - 対象のデッキID
 * @param targetColor - 判定したい色（"赤", "青" など）
 * @returns 勝者のプレイヤーID、または勝者なし(null)
 */
export const scoreCalculator = (
    state: RoomState,
    deckId: string,
    targetColor: string
): string | null => {
    const fieldCards = state.playFieldCards[deckId] ?? [];

    // { "playerA": 3, "playerB": 1 }
    const playerCounts: Record<string, number> = {};

    // 1. 指定された色のカードだけをカウント
    fieldCards.forEach(card => {
        if (!card.ownerId || !card.name) return;

        const color = card.name.charAt(0);
        if (color !== targetColor) return;

        playerCounts[card.ownerId] = (playerCounts[card.ownerId] || 0) + 1;
    });

    // 2. その色の中で最多のプレイヤーを特定
    let winnerId: string | null = null;
    let maxCount = 0;

    Object.entries(playerCounts).forEach(([playerId, count]) => {
        if (count > maxCount) {
            maxCount = count;
            winnerId = playerId;
        }
    });

    return winnerId;
};