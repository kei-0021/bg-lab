// src/server/fireworksConfig.ts

import type { Card, DeckDrawData, RoomParam, RoomState } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";

export const fireworksⅡConfig: RoomConfig = {
  gameId: "fireworksⅡ",
  dataFiles: {
    cards: "../public/data/fireworksCards.json",
    themeCards: "../public/data/fireworksThemeCards.json",
    colorCards: "../public/data/fireworksColorCards.json",
  },
  // サーバー側でロードしたデータを setup に渡す
  setup: async (loadedData: Record<string, any>): Promise<RoomParam> => {
    const helper = new SetupHelper();

    const defaults: Partial<Card> = {
      location: 'deck',
      drawCondition: ['hand', 'back'],
      playLocation: 'field',
      fieldBackCondition: ['deck', 'back'],
    };

    const themeDefaults: Partial<Card> = {
      location: "deck",
      drawCondition: ["discard", "face"],
    };

    const fireworksCards = helper.createUniqueCards(
      helper.initializeCards(helper.assertCards(loadedData.cards), defaults),
      3,
    );

    const fireworksThemeCards = helper.createUniqueCards(
      helper.initializeCards(helper.assertCards(loadedData.themeCards), themeDefaults),
      3,
    );

    const fireworksColorCards = helper.createUniqueCards(
      helper.initializeCards(helper.assertCards(loadedData.colorCards), themeDefaults),
      3,
    );

    return {
      gameId: "fireworksⅡ",
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
          backColor: "#752929",
        },
        {
          deckId: "color",
          name: "カラーカード",
          cards: fireworksColorCards,
          backColor: "#ffffff",
        },
      ],
      initialHand: { deckId: "firework", count: 5 },
      initialBoard: [],
      onDeckDraw: (_param: RoomParam, _state: RoomState, data: DeckDrawData) => {
        if (['theme', 'color'].includes(data.deckId)) {
          process.stdout.write(`${data.deckId}）のカードを表にしました。続いてカードを3枚まで出してください\n`);
        }
      },
      checkGameEnd: (state: RoomState) =>
        // 終了条件: 8ラウンド終了 (8ラウンド目の最後 かつ 最後のプレイヤーの手番時)
        state.currentRoundIndex >= 7 &&
        state.currentTurnIndex == state.initRoomState.players.length - 1,
      onGameEnd: (state: RoomState) => {
        const rankings = [...state.initRoomState.players]
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