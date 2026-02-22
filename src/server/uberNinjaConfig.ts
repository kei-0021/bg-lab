// src/server/uberNinjaConfig.ts

interface SetupTools {
  assertCards: (cards: any[], deckId: string) => any[];
  createUniqueCards: (cards: any[], numSets: number) => any[];
  createTokenStore: (id: string, name: string, templates: any[], count: number) => any[];
  createBoardLayout: (baseCells: any[], cellCounts: Record<string, number>, rows: number, cols: number) => any[][];
}

export const uberNinjaConfig = {
  id: "uberninja",
  dataFiles: {
    actionCards: "../public/data/deepSeaActionCards.json",
  },
  setup: (
    data: Record<string, any>,
    { assertCards, createUniqueCards }: SetupTools,
  ): any => {
    const deepSeaActionCards = createUniqueCards(
      assertCards(data.actionCards, "deepSeaAction"),
      3,
    );

    return {
      initialDecks: [
        {
          deckId: "deepSeaAction",
          name: "アクションカード",
          cards: deepSeaActionCards,
          backColor: "#0d8999ff",
        },
      ],
      initialHand: { deckId: "deepSeaAction", count: 8 },
    };
  },
};