// tests/server/sampleConfig.ts

import type { DraggableData, DraggableId, GameParam } from "react-game-ui";
import { SetupHelper, type RoomConfig } from "react-game-ui/server-io-utils";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1200;

const Z_INDX_DRAGGABLE = 201;

export const amanogawaConfig: RoomConfig = {
  gameId: "amanogawa",
  dataFiles: {},
  setup: async (_loadedData: Record<string, any>): Promise<GameParam> => {
    const helper = new SetupHelper();

    const draggables: Record<DraggableId, DraggableData> = {};
    draggables["piece"] = helper.createDraggable(
      "piece",
      { x: 0.5 * GAME_WIDTH, y: 0.8 * GAME_HEIGHT },
      100,
    );
    for (let i = 0; i < 25; i++) {
      const id = `piece-${i}`;
      const initialX = (0.05 + (i % 4) * 0.04) * GAME_WIDTH;
      const initialY = (0.4 + Math.floor(i / 4) * 0.04) * GAME_HEIGHT;
      draggables[id] = helper.createDraggable(
        id,
        { x: initialX, y: initialY },
        Z_INDX_DRAGGABLE + i,
      );
    }

    return {
      gameId: "amanogawa",
      gameIcon: "⭐️",
      initialDecks: [],
      draggable: draggables,
      maxPlayers: 2,
    };
  },
};
