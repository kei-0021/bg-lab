// src/types/config.ts

import type { GameId } from "react-game-ui"

export type Config = {
    gameId: GameId,
    dataFiles: Record<string, any>
    setup: any,
}