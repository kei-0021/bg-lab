// src/server/fireworksConfig.ts

import type {
  CardData,
  DeckDrawData,
  GameParam,
  Player,
  RoomManager,
  RoomState,
} from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";
import { FireworksⅡPhase } from "../types/phase.js";
import {
  colorScoreCalculator,
  maxScoreCalculator,
  mostFrequentNumberCalculator,
} from "./scoreCalculator.js";

export const fireworksⅡConfig: RoomConfig = {
  gameId: "fireworksⅡ",
  dataFiles: {
    cards: "../public/data/fireworks/fireworksCards.json",
    themeCards: "../public/data/fireworks/fireworksThemeCards.json",
    colorCards: "../public/data/fireworks/fireworksColorCards.json",
  },
  // サーバー側でロードしたデータを setup に渡す
  setup: async (loadedData: Record<string, any>): Promise<GameParam> => {
    const helper = new SetupHelper();

    const defaults: Partial<CardData> = {
      location: "deck",
      drawCondition: ["hand", "back"],
      playLocation: "field",
      fieldBackCondition: ["deck", "back"],
    };

    const themeDefaults: Partial<CardData> = {
      location: "deck",
      drawCondition: ["discard", "face"],
    };

    const fireworksCards = helper.createUniqueCards(
      helper.initializeCards(helper.assertCards(loadedData.cards), defaults),
      3,
    );

    const fireworksThemeCards = helper.createUniqueCards(
      helper.initializeCards(
        helper.assertCards(loadedData.themeCards),
        themeDefaults,
      ),
      3,
    );

    const fireworksColorCards = helper.createUniqueCards(
      helper.initializeCards(
        helper.assertCards(loadedData.colorCards),
        themeDefaults,
      ),
      3,
    );

    return {
      gameId: "fireworksⅡ",
      gameIcon: "🎆",

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
      initialHand: { firework: 5 },
      onDeckDraw: (
        _state: RoomState,
        manager: RoomManager,
        data: DeckDrawData,
      ) => {
        if (["theme", "color"].includes(data.deckId)) {
          manager.updatePhase(FireworksⅡPhase.SETUP);
          manager.emitSystemMessage("カードを3枚まで選んでください", 0, true);
        }
      },
      onAllPlayersCardHold: async (state: RoomState, manager: RoomManager) => {
        // ホールド状態を解除
        manager.unholdCards();
        await manager.sleep(500);

        // 評価フェーズへ
        manager.updatePhase(FireworksⅡPhase.EVALUATION);
        await manager.emitSystemMessage("全員がカードを出し終えました！", 1500);

        const discardThemeStack = state.discardPile["theme"] ?? [];
        const discardColorStack = state.discardPile["color"] ?? [];

        // 1. 演目賞の発表
        await manager.emitSystemMessage("【演目賞】の発表です...", 1500, true);

        if (discardThemeStack.length > 0) {
          const lastCard = discardThemeStack.at(-1);
          if (lastCard?.name) {
            const targetTheme = lastCard.name;
            const winners =
              targetTheme === "大輪"
                ? maxScoreCalculator(state, "firework")
                : mostFrequentNumberCalculator(state, "firework");

            if (winners.length > 0) {
              const winnerNames = winners.map((w) => w.playerName).join(", ");
              await manager.emitSystemMessage("演目賞獲得！", 1500);
              winners.forEach((winner) => manager.addScore(winner.playerId, 1));
              await manager.emitSystemMessage(
                `最も ${targetTheme} の条件を満たしたのは ${winnerNames} だ! +1点!`,
                2000,
                true,
              );
            } else {
              await manager.emitSystemMessage("該当者なし！", 1500, true);
            }
          }
        } else {
          await manager.emitSystemMessage(
            "演目カードが提示されていません。",
            1500,
            true,
          );
        }

        // 2. カラー賞の発表
        await manager.emitSystemMessage(
          "続いて【カラー賞】の発表です...",
          1500,
          true,
        );

        if (discardColorStack.length > 0) {
          const lastCard = discardColorStack.at(-1);
          if (lastCard?.name) {
            const targetEmoji = lastCard.name;
            const colorMap: Record<string, string> = {
              "🔵": "青",
              "🔴": "赤",
              "🟡": "黄",
              "🟢": "緑",
              "⚪": "白",
            };

            const targetColor = colorMap[targetEmoji] || targetEmoji;
            const winners = colorScoreCalculator(
              state,
              "firework",
              targetColor,
            );

            if (winners.length > 0) {
              const winnerNames = winners.map((w) => w.playerName).join(", ");
              await manager.emitSystemMessage("カラー賞獲得！", 1500);
              winners.forEach((winner) => manager.addScore(winner.playerId, 1));
              await manager.emitSystemMessage(
                `最も多く ${targetColor} を出したのは ${winnerNames} だ! +1点!`,
                2000,
                true,
              );
            } else {
              await manager.emitSystemMessage("該当者なし！", 1500, true);
            }
          }
        } else {
          await manager.emitSystemMessage(
            "カラーカードが提示されていません。",
            1500,
            true,
          );
        }

        manager.emitSystemMessage(
          "全評価終了。次の演目へ準備してください。",
          0,
          true,
        );

        // 待機フェーズへ
        manager.updatePhase(FireworksⅡPhase.WAITINGFORNEXTROUND);
      },
      onNextRound: async (state: RoomState, manager: RoomManager) => {
        manager.updatePhase(FireworksⅡPhase.PLANNING);
        await manager.emitSystemMessage(
          `第 ${state.currentRoundIndex + 1} 演目（ラウンド）開始！`,
          1500,
        );
        // 場のカードを捨て札に移動する
        const cardsInField = [...(state.playFieldCards["firework"] ?? [])];
        for (const card of cardsInField) {
          manager.moveFromField("firework", card.id, null);
          await manager.sleep(100);
        }
        // 手札がないなら5枚配布する
        for (const player of state.players) {
          if ((player.cards?.length ?? 0) === 0) {
            for (let i = 0; i < 5; i++) {
              manager.drawCard("firework", ["hand", "back"], player.id);
              manager.emitDeckUpdate("firework");
              manager.emitPlayerUpdate();
              await manager.sleep(300);
            }
            manager.emitSystemMessage(
              `${player.name} に5枚のカードを補充しました`,
            );
          }
        }
        manager.emitSystemMessage(
          "演目 or カラーカードのどちらかを引いてください",
          0,
          true,
        );
      },
      checkGameEnd: (state: RoomState) =>
        // 終了条件: 8ラウンド終了
        state.currentRoundIndex >= 7,
      onGameEnd: (state: RoomState) => {
        const rankings = [...state.players]
          .sort((a: any, b: any) => b.tokens.length - a.tokens.length)
          .map((player: Player, index: number) => ({
            rank: index + 1,
            name: player.name,
            tokens: player.score,
          }));
        return {
          message: "全演目の打ち上げが終了しました。本日の最優秀職人は…",
          rankings,
          finalRound: state.currentRoundIndex,
        };
      },
      components: [],
    };
  },
};
