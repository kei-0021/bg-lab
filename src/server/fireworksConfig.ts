// src/server/fireworksConfig.ts

import type { Card, GameParam, RoomState } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";

export const fireworksConfig: RoomConfig = {
  gameId: "fireworks",
  dataFiles: {
    cards: "../public/data/fireworksCards.json",
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
          tokenStoreId: "STAR_PARTS",
          name: "秘伝玉",
          tokens: [
            {
              id: "STAR_PART-1",
              name: "秘伝玉",
              color: "#FFD700",
              count: 10,
              imageSrc: "",
            },
          ],
        },
      ],
      initialHand: { deckId: "firework", count: 5 },
      initialBoard: [],
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
