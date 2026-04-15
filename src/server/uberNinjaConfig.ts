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

    const deliverBoard = helper.createGridBoardLayout(loadedData.deliverBoard, CELL_COUNTS, 8, 8);

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
      initialTokenStores: [
        {
          tokenStoreId: 'makibishi',
          name: '撒菱',
          tokens: helper.createTokenStore(
            [{ id: '撒菱', name: '撒菱', ownerId: null, position: null, movableCells: [] }],
            10,
            "/images/uberninja/makibishi.svg",
            '#d43737',
          ),
        }],
      initialTokens: { makibishi: 5 },
      initialTokensOnBoard: {
        // プレイヤー入室時に複製される忍者本体テンプレート
        'ninja': [{
          id: 'ninja',
          tokenStoreId: "ninja",
          name: 'ninja',
          ownerId: "player",
          color: '#ff4444',
          position: { row: 0, col: 3 },
          movableCells: [],
          image: "/images/uberninja/ninja.svg"
        }],
        'ninja-potato': [{
          id: 'ninja-potato',
          tokenStoreId: 'ninja-potato',
          name: 'ninja-potato',
          ownerId: null,
          color: "white",
          position: { row: 4, col: 0 },
          movableCells: [],
          image: "/images/uberninja/ninja-potato.png"
        }],
        // プレイヤー入室時に複製されるスクーターテンプレート
        'scooter': [{
          id: 'scooter',
          tokenStoreId: "scooter",
          name: 'scooter',
          ownerId: "player",
          color: '#ff4444',
          position: { row: 0, col: 4 },
          movableCells: [],
          image: "/images/uberninja/scooter.svg"
        }],
      },

      components: [],
    };
  },
};