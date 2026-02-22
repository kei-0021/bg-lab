// src/server/uberNinjaConfig.ts

interface SetupTools {
  assertCards: (cards: any[], deckId: string) => any[];
}

export const uberNinjaConfig = {
  id: "uberninja",
  dataFiles: {
    orderCards: "../public/data/uberNinjaOrder.json",
  },
  setup: (data: Record<string, any>, { assertCards }: SetupTools): any => {
    const uberNinjaOrderCards = assertCards(data.orderCards, "order");

    return {
      initialDecks: [
        {
          deckId: "order",
          name: "注文カード",
          cards: uberNinjaOrderCards,
          backColor: "rgb(11, 108, 26)",
        },
      ],
      initialHand: { deckId: "deepSeaAction", count: 0 },
    };
  },
};
