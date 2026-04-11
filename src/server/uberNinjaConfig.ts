// src/server/uberNinjaConfig.ts

import type { GameParam } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";

export const CELL_COUNTS = {
  SIMPLE: 64,
};

export const uberNinjaConfig: RoomConfig = {
  gameId: "uberninja",
  dataFiles: {
    orderCards: "../public/data/uberninja/uberNinjaOrderCards.json",
    deliverBoard: "../public/data/uberninja/uberNinjaCells.json",
  },
  setup: async (loadedData: Record<string, any>): Promise<GameParam> => {
    const helper = new SetupHelper();
    const uberNinjaOrderCards = helper.assertCards(loadedData.orderCards);

    const deliverBoard = helper.createGridBoardLayout(loadedData.deliverBoard, CELL_COUNTS, 8, 8)

    return {
      gameId: "uberninja",
      gameIcon: "🥷",
      initialDecks: [
        {
          deckId: "order",
          name: "注文カード",
          cards: uberNinjaOrderCards,
          backColor: "rgb(11, 108, 26)",
        },
      ],
      initialBoard: { "deliver": deliverBoard },
      pieceImage: "/images/uberninja/ninja.svg",
      extraPieces: {
        'makibishi-01': {
          id: 'makibishi-01',
          name: 'makibishi',
          color: '#ff4444',
          location: { row: 2, col: 3 },
          image: "/images/uberninja/makibishi.svg"
        },
        'makibishi-02': {
          id: 'makibishi-02',
          name: 'makibishi',
          color: '#ff4444',
          location: { row: 5, col: 5 },
          image: "/images/uberninja/makibishi.svg"
        },
      },
      components: [],
    };
  },
};
