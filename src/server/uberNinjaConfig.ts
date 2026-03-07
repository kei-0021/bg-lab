// src/server/uberNinjaConfig.ts

import type { GameParam } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";

export const uberNinjaConfig: RoomConfig = {
  gameId: "uberninja",
  dataFiles: {
    orderCards: "../public/data/uberNinjaOrder.json",
  },
  setup: async (loadedData: Record<string, any>): Promise<GameParam> => {
    const helper = new SetupHelper();
    const uberNinjaOrderCards = helper.assertCards(loadedData.orderCards);

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
