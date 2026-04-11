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

    // 撒菱（まきびし）を5個、盤面のランダムな位置に生成
    const makibishis = Object.fromEntries(
      Array.from({ length: 5 }).map((_, i) => {
        const id = `makibishi-${i + 1}`;
        return [
          id,
          {
            id,
            name: '撒菱',
            ownerId: null,
            color: '#ff4444',
            position: {
              row: Math.floor(Math.random() * 8),
              col: Math.floor(Math.random() * 8)
            },
            movableCells: [],
            image: "/images/uberninja/makibishi.svg"
          }
        ];
      })
    );

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
      initialPieces: {
        ...makibishis,
        // プレイヤー入室時に複製される忍者本体テンプレート
        'ninja': {
          id: 'ninja',
          name: 'ninja',
          ownerId: "player",
          color: '#ff4444',
          position: { row: 0, col: 3 },
          movableCells: [],
          image: "/images/uberninja/ninja.svg"
        },
        // プレイヤー入室時に複製されるスクーターテンプレート
        'scooter': {
          id: 'scooter',
          name: 'scooter',
          ownerId: "player",
          color: '#ff4444',
          position: { row: 0, col: 4 },
          movableCells: [],
          image: "/images/uberninja/scooter.svg"
        },
      },
      components: [],
    };
  },
};