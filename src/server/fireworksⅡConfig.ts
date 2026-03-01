// src/server/fireworksConfig.ts

import type { Card, DeckId, RoomParam, RoomState } from "react-game-ui";
import type { Config } from "../types/config";
/**
 * 花火ゲームの固有設定
 */
interface SetupTools {
  assertCards: (cards: Card[], deckId: DeckId) => Card[];
  createUniqueCards: (cards: any[], numSets: number) => Card[];
  createTokenStore: (
    id: string,
    name: string,
    templates: any[],
    count: number,
  ) => any[];
  createBoardLayout: (
    baseCells: any[],
    cellCounts: Record<string, number>,
    rows: number,
    cols: number,
  ) => any[][];
}

export const fireworksⅡConfig: Config = {
  gameId: "fireworksⅡ",
  dataFiles: {
    cards: "../public/data/fireworksCards.json",
  },
  // サーバー側でロードしたデータを setup に渡す
  setup: (loadedData: Record<string, any>, helpers: SetupTools): RoomParam => {
    // 固有ロジック：カードを3セット分複製してユニーク化
    const fireworksCards = helpers.createUniqueCards(
      helpers.assertCards(loadedData.cards, "firework"),
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
      ],
      initialTokenStores: [
        {
          tokenStoreId: "STAR_PARTS",
          name: "秘伝玉",
          tokens: [
            { id: "STAR_PART-1", name: "秘伝玉", color: "#FFD700", count: 10, imageSrc: "" }
          ],
        }
      ],
      initialHand: { deckId: "firework", count: 5 },
      initialBoard: [],
      checkGameEnd: (room: RoomState) =>
        // 終了条件: 10ラウンド終了 (10ラウンド目の最後 かつ 最後のプレイヤーの手番時)
        room.currentRoundIndex >= 9 &&
        room.currentTurnIndex == room.initRoomState.players.length - 1,
      onGameEnd: (roomState: RoomState) => {
        const rankings = [...roomState.initRoomState.players]
          .sort((a: any, b: any) => b.tokens.length - a.tokens.length)
          .map((player: any, index: number) => ({
            rank: index + 1,
            name: player.name,
            tokens: player.tokens.length,
          }));
        return {
          message: "全演目の打ち上げが終了しました。本日の最優秀職人は…",
          rankings,
          finalRound: roomState.currentRoundIndex,
        };
      },
    };
  },
};