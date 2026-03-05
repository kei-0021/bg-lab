import type { RoomState } from "react-game-ui";

/**
 * 指定された色の中で、最多出展者を計算する（同点の場合は全員抽出）
 * @param state - ルームの状態
 * @param deckId - 対象のデッキID
 * @param targetColor - 判定したい色（"赤", "青" など）
 * @returns 勝者のプレイヤーIDの配列
 */
export const colorScoreCalculator = (
    state: RoomState,
    deckId: string,
    targetColor: string
): string[] => {
    const fieldCards = state.playFieldCards[deckId] ?? [];

    // { "playerA": 3, "playerB": 3, "playerC": 1 }
    const playerCounts: Record<string, number> = {};
    let maxCount = 0;

    // 1. 指定された色のカードをカウントし、最大枚数も特定
    fieldCards.forEach(card => {
        if (!card.ownerId || !card.name) return;

        const color = card.name.charAt(0);
        if (color !== targetColor) return;

        const newCount = (playerCounts[card.ownerId] || 0) + 1;
        playerCounts[card.ownerId] = newCount;

        if (newCount > maxCount) {
            maxCount = newCount;
        }
    });

    // カードが1枚もない場合
    if (maxCount === 0) return [];

    // 2. 最大枚数と同じカウントを持つプレイヤーをすべて抽出
    return Object.entries(playerCounts)
        .filter(([_, count]) => count === maxCount)
        .map(([playerId, _]) => playerId);
};

/**
 * フィールドに出されたカードの中で、最大数値を出したプレイヤー全員を抽出する
 * @param state - ルームの状態
 * @param deckId - 対象のデッキID
 * @returns 最大値を出したプレイヤーIDの配列
 */
export const maxScoreCalculator = (
    state: RoomState,
    deckId: string
): string[] => {
    const fieldCards = state.playFieldCards[deckId] ?? [];

    // 各プレイヤーがその場に出した最大値を記録
    const playerMaxValues: Record<string, number> = {};
    let overallMaxValue = -1; // 数値0のカードがある可能性を考慮して -1 から開始

    fieldCards.forEach(card => {
        if (!card.ownerId || !card.name) return;

        // 文字列から数値を抽出（例: "赤5" や "青10" の後ろの数字部分）
        const value = parseInt(card.name.substring(1), 10);

        if (isNaN(value)) return;

        // 全体の中での最大数値を更新
        if (value > overallMaxValue) {
            overallMaxValue = value;
        }

        // プレイヤー個人の最大値を更新
        const currentMax = playerMaxValues[card.ownerId] ?? -1;
        if (value > currentMax) {
            playerMaxValues[card.ownerId] = value;
        }
    });

    // カードが1枚もない、または有効な数値がない場合
    if (overallMaxValue === -1) return [];

    // 全体の最大値と同じ数値を持っているプレイヤーをすべて抽出
    return Object.entries(playerMaxValues)
        .filter(([_, max]) => max === overallMaxValue)
        .map(([playerId, _]) => playerId);
};

/**
 * フィールドに出されたカードの中で、同じ番号を最も多く出したプレイヤー全員を抽出する
 * @param state - ルームの状態
 * @param deckId - 対象のデッキID
 * @returns 最多枚数出したプレイヤーIDの配列
 */
export const mostFrequentNumberCalculator = (
    state: RoomState,
    deckId: string
): string[] => {
    const fieldCards = state.playFieldCards[deckId] ?? [];

    // { "playerA": { "1": 3, "5": 1 }, "playerB": { "1": 1 } }
    const playerNumberCounts: Record<string, Record<string, number>> = {};

    // 全体で最も多い出現回数
    let maxOccurrence = 0;

    fieldCards.forEach(card => {
        if (!card.ownerId || !card.name) return;

        const numberStr = card.name.substring(1);
        if (isNaN(parseInt(numberStr, 10))) return;

        // プレイヤーごとの番号カウントを初期化
        if (!playerNumberCounts[card.ownerId]) {
            playerNumberCounts[card.ownerId] = {};
        }

        const counts = playerNumberCounts[card.ownerId];
        counts[numberStr] = (counts[numberStr] || 0) + 1;

        // このカウントが全体の中での最多記録か更新
        if (counts[numberStr] > maxOccurrence) {
            maxOccurrence = counts[numberStr];
        }
    });

    if (maxOccurrence === 0) return [];

    // 最多回数を出したプレイヤーを特定
    const winners: string[] = [];
    Object.entries(playerNumberCounts).forEach(([playerId, counts]) => {
        // そのプレイヤーが持っているカウントの中に、全体最多と一致するものがあるか
        const hasMax = Object.values(counts).some(count => count === maxOccurrence);
        if (hasMax) {
            winners.push(playerId);
        }
    });

    return winners;
};