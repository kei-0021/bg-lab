/**
 * 花火ゲームの固有設定
 */
interface SetupTools {
  assertCards: (cards: any[], deckId: string) => any[];
  createUniqueCards: (cards: any[], numSets: number) => any[];
  createTokenStore: (id: string, name: string, templates: any[], count: number) => any[];
  createBoardLayout: (baseCells: any[], cellCounts: Record<string, number>, rows: number, cols: number) => any[][];
}

export const fireworksConfig = {
  id: "fireworks",
  dataFiles: {
    cards: "../public/data/fireworksCards.json",
    themes: "../public/data/fireworksThemeCards.json",
  },
  // サーバー側でロードしたデータを setup に渡す
  setup: (loadedData: Record<string, any>, helpers: SetupTools): any => {
    // 固有ロジック：カードを3セット分複製してユニーク化
    const fireworksCards = helpers.createUniqueCards(
      helpers.assertCards(loadedData.cards, "firework"),
      3,
    );
    const fireworksThemeCards = helpers.assertCards(loadedData.themes, "theme");

    return {
      initialDecks: [
        {
          deckId: "firework",
          name: "花火カード",
          cards: fireworksCards,
          backColor: "#000000",
        },
        {
          deckId: "theme",
          name: "演目カード",
          cards: fireworksThemeCards,
          backColor: "#ff0000",
        },
      ],
      initialResources: [],
      initialTokenStore: helpers.createTokenStore(
        "STAR_PARTS",
        "秘伝玉",
        [{ id: "STAR_PART", name: "秘伝玉", color: "#FFD700" }],
        20,
      ),
      initialHand: { deckId: "firework", count: 5 },
      initialBoard: [],
      checkGameEnd: (gameState: any) => gameState.currentRoundIndex >= 5,
      onGameEnd: (gameState: any) => {
        const rankings = [...gameState.gameStateInstance.players]
          .sort((a: any, b: any) => b.tokens.length - a.tokens.length)
          .map((player: any, index: number) => ({
            rank: index + 1,
            name: player.name,
            tokens: player.tokens.length,
          }));
        return {
          message: "全演目の打ち上げが終了しました。本日の最優秀職人は…",
          rankings,
          finalRound: gameState.currentRound,
        };
      },
    };
  },
};