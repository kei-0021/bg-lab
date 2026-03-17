// src/server/fireworksConfig.ts

import type {
  Card,
  DraggableData,
  DraggableId,
  GameParam,
  RoomState,
} from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";
import { cellShuffleAndReconnector } from "./shuffleAndReconnector";

export const CELL_COUNTS = {
  EMPTY: 4,
  CARD: 3,
  FILM: 2,
};

const Z_INDEX_FILM = 2000;

export const fireworksConfig: RoomConfig = {
  gameId: "fireworks",
  dataFiles: {
    cards: "../public/data/fireworks/fireworksCards.json",
    fireworksCells: "../public/data/fireworks/fireworksCells.json",
  },
  // サーバー側でロードしたデータを setup に渡す
  setup: async (loadedData: Record<string, any>): Promise<GameParam> => {
    const helper = new SetupHelper();

    const defaults: Partial<Card> = {
      location: "deck",
      drawCondition: ["hand", "face"],
      playLocation: "field",
      fieldBackCondition: ["deck", "back"],
    };

    const fireworksCards = helper.createUniqueCards(
      helper.initializeCards(helper.assertCards(loadedData.cards), defaults),
      3,
    );

    const fireworksBoard = helper.createGridBoardLayout(
      loadedData.fireworksCells,
      CELL_COUNTS,
      3,
      3,
    );

    const draggables: Record<DraggableId, DraggableData> = {};
    for (let i = 0; i < 4; i++) {
      const id = `film-${i}`;
      draggables[id] = helper.createDraggable(
        id,
        { x: 950 + i * 5, y: 850 + i * 5 },
        Z_INDEX_FILM + i,
      );
    }
    for (let i = 0; i < 4; i++) {
      const id = `film-${i + 4}`;
      draggables[id] = helper.createDraggable(
        id + 4,
        { x: 1350 + i * 5, y: 850 + i * 5 },
        Z_INDEX_FILM + i,
      );
    }

    return {
      gameId: "fireworks",
      initialDecks: [
        {
          deckId: "firework",
          name: "花火カード",
          cards: fireworksCards,
          backColor: "#000000",
        },
      ],
      initialTokenStores: [
        {
          tokenStoreId: "goldfish",
          name: "金魚",
          tokens: helper.createTokenStore(
            [{ id: "goldfish", name: "金魚" }],
            30,
            "/images/fireworks/goldfish.png",
            "#ffffff7c",
          ),
        },
      ],
      initialHand: { deckId: "firework", count: 5 },
      initialBoard: { fireworksBoard: fireworksBoard },
      shuffleAndReconnectBoard: { "fireworksBoard": cellShuffleAndReconnector },
      pieceImage: "/images/fireworks/hanabishi.svg",
      draggable: draggables,
      checkGameEnd: (state: RoomState) =>
        // 終了条件: 10ラウンド終了 (10ラウンド目の最後 かつ 最後のプレイヤーの手番時)
        state.currentRoundIndex >= 9 &&
        state.currentTurnIndex == state.players.length - 1,
      onGameEnd: (state: RoomState) => {
        const rankings = [...state.players]
          .sort((a: any, b: any) => b.tokens.length - a.tokens.length)
          .map((player: any, index: number) => ({
            rank: index + 1,
            name: player.name,
            tokens: player.tokens.length,
          }));
        return {
          message: "全演目の打ち上げが終了しました。本日の最優秀職人は…",
          rankings,
          finalRound: state.currentRoundIndex,
        };
      },
    };
  },
};
