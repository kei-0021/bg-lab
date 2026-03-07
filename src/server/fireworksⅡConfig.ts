// src/server/fireworksConfig.ts

import type { Card, CardPlayData, DeckDrawData, GameParam, RoomManager, RoomState } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";
import { FireworksⅡPhase } from "../types/phase.js";
import { colorScoreCalculator, maxScoreCalculator, mostFrequentNumberCalculator } from "./scoreCalculator.js";

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
          manager.emitSystemMessage("カードを3枚まで選んでください", true);
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
        manager.emitSystemMessage("全員がカードを出し終えました！");
        await sleep(1500);

        const discardThemeStack = state.discardPile["theme"] ?? [];
        const discardColorStack = state.discardPile["color"] ?? [];

        // 1. 演目賞の発表
        manager.emitSystemMessage("【演目賞】の発表です...", true);
        await sleep(2000);

        if (discardThemeStack.length > 0) {
          const lastCard = discardThemeStack.at(-1);
          if (lastCard?.name) {
            const targetTheme = lastCard.name;
            const winners = targetTheme === "大輪"
              ? maxScoreCalculator(state, "firework")
              : mostFrequentNumberCalculator(state, "firework");

            if (winners.length > 0) {
              const winnerNames = winners.map(w => w.playerName).join(", ");
              manager.emitSystemMessage("演目賞獲得！");
              await sleep(1500);
              manager.emitSystemMessage(`最も ${targetTheme} の条件を満たしたのは ${winnerNames} だ! +1点!`, true);
              winners.forEach((winner) => manager.addScore(winner.playerId, 1));
              await sleep(2000);
            } else {
              manager.emitSystemMessage("該当者なし！", true);
              await sleep(2000);
            }
          }
        } else {
          manager.emitSystemMessage("演目カードが提示されていません。", true);
          await sleep(2000);
        }

        // 2. カラー賞の発表
        manager.emitSystemMessage("続いて【カラー賞】の発表です...", true);
        await sleep(2000);

        if (discardColorStack.length > 0) {
          const lastCard = discardColorStack.at(-1);
          if (lastCard?.name) {
            const targetEmoji = lastCard.name;
            const colorMap: Record<string, string> = {
              "🔵": "青",
              "🔴": "赤",
              "🟡": "黄",
              "🟢": "緑",
              "⚪": "白"
            };

            const targetColor = colorMap[targetEmoji] || targetEmoji;
            const winners = colorScoreCalculator(state, "firework", targetColor);

            if (winners.length > 0) {
              const winnerNames = winners.map(w => w.playerName).join(", ");
              manager.emitSystemMessage("カラー賞獲得！");
              await sleep(1500);
              manager.emitSystemMessage(`最も多く ${targetColor} を出したのは ${winnerNames} だ! +1点!`, true);
              winners.forEach((winner) => manager.addScore(winner.playerId, 1));
              await sleep(2000);
            } else {
              manager.emitSystemMessage("該当者なし！", true);
              await sleep(2000);
            }
          }
        } else {
          manager.emitSystemMessage("カラーカードが提示されていません。", true);
          await sleep(2000);
        }

        manager.emitSystemMessage("全評価終了。次の演目へ準備してください。", true);
      },
      onNextRound: async (state: RoomState, manager: RoomManager) => {
        manager.updatePhase(FireworksⅡPhase.PLANNING);
        manager.emitSystemMessage(`第 ${state.currentRoundIndex + 1} 演目（ラウンド）開始！`)
        await sleep(1500);
        // 場のカードを捨て札に移動する
        const cardsInField = [...(state.playFieldCards["firework"] ?? [])];
        for (const card of cardsInField) {
          manager.moveFromField("firework", card.id, null);
          await sleep(100);
        }
        // 手札がないなら5枚配布する
        for (const player of state.players) {
          if ((player.cards?.length ?? 0) === 0) {
            for (let i = 0; i < 5; i++) {
              manager.drawCard("firework", ["hand", "back"], player.id);
              manager.emitDeckUpdate("firework");
              manager.emitPlayerUpdate();
              await sleep(300);
            }
            manager.emitSystemMessage(`${player.name} に5枚のカードを補充しました`);
          }
        }
        manager.emitSystemMessage("演目 or カラーカードのどちらかを引いてください", true);
      },
      checkGameEnd: (state: RoomState) =>
        // 終了条件: 8ラウンド終了
        state.currentRoundIndex >= 7,
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