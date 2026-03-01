// src/server/uberNinjaConfig.ts

import type { Card, DeckId, RoomParam } from "react-game-ui";
import type { Config } from "../types/config";

interface SetupTools {
  assertCards: (cards: Card[], deckId: DeckId) => Card[];
}

export const uberNinjaConfig: Config = {
  gameId: "uberninja",
  dataFiles: {
    orderCards: "../public/data/uberNinjaOrder.json",
  },
  setup: (data: Record<string, any>, { assertCards }: SetupTools): RoomParam => {
    const uberNinjaOrderCards = assertCards(data.orderCards, "order");

    return {
      gameId: "uberninja",
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
