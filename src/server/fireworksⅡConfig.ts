// src/server/fireworksConfig.ts

import type { Card, CardPlayData, DeckDrawData, GameParam, RoomManager, RoomState } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";
import { FireworksⅡPhase } from "../types/phase.js";
import { scoreCalculator } from "./scoreCalculator.js";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fireworksⅡConfig: RoomConfig = {
  gameId: "fireworksⅡ",
  dataFiles: {
    cards: "../public/data/fireworksCards.json",
    themeCards: "../public/data/fireworksThemeCards.json",
    colorCards: "../public/data/fireworksColorCards.json",
  },
  // サーバー側でロードしたデータを setup に渡す
  setup: async (loadedData: Record<string, any>): Promise<GameParam> => {
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
      onDeckDraw: (_state: RoomState, manager: RoomManager, data: DeckDrawData) => {
        if (['theme', 'color'].includes(data.deckId)) {
          manager.updatePhase(FireworksⅡPhase.SETUP)
        }
      },
      onCardPlay: async (state: RoomState, manager: RoomManager, _data: CardPlayData) => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        const deckId = "firework";

        // 全員がカードを出したかチェック
        const cards = state.playFieldCards[deckId] ?? [];
        const submittedPlayerIds = new Set(cards.map(card => card.ownerId).filter(id => id !== null));
        if (submittedPlayerIds.size !== state.players.length) return;

        // 全員出揃ったら評価フェーズへ
        manager.updatePhase(FireworksⅡPhase.EVALUATION);
        await sleep(500);

        // 特定の色（例：「赤」）の最多賞を計算して加点
        // 捨て札の山（配列）を取得
        const discardStack = state.discardPile["color"] ?? [];

        if (discardStack.length > 0) {
          const lastCard = discardStack.at(-1);
          if (lastCard?.name) {
            // 絵文字をそのまま色名として扱う
            // 例: "🔵" が取れる
            const targetEmoji = lastCard.name;

            // 手札側の名前に合わせるためのマッピング
            const colorMap: Record<string, string> = {
              "🔵": "青",
              "🔴": "赤",
              "🟡": "黄",
              "🟢": "緑",
              "⚪": "白"
            };

            const targetColor = colorMap[targetEmoji] || targetEmoji;
            const winnerId = scoreCalculator(state, "firework", targetColor);

            if (winnerId) {
              await sleep(1000);
              manager.addScore(winnerId, 1);
            }
          }
        }
      },
      onNextRound: async (state: RoomState, manager: RoomManager) => {
        manager.updatePhase(FireworksⅡPhase.PLANNING);
        // 手札がないなら5枚配布する
        for (const player of state.players) {
          if ((player.cards?.length ?? 0) === 0) {
            for (let i = 0; i < 5; i++) {
              manager.drawCard("firework", ["hand", "back"], player.id);
              manager.emitDeckUpdate("firework");
              manager.emitPlayerUpdate();
              await sleep(300);
            }
            console.log(`[NextRound] ${player.name} に1枚ずつ補充しました`);
          }
        }
        // 場のカードを捨て札に移動する
        const cardsInField = [...(state.playFieldCards["firework"] ?? [])];
        for (const card of cardsInField) {
          manager.moveFromField("firework", card.id, null);
          await sleep(100);
        }
      },
      checkGameEnd: (state: RoomState) =>
        // 終了条件: 8ラウンド終了 (8ラウンド目の最後 かつ 最後のプレイヤーの手番時)
        state.currentRoundIndex >= 7 &&
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