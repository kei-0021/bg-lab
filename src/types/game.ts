// src/types/game.ts
import type { RoomState } from "react-game-ui";

export type ComponentType =
    | "Deck"
    | 'PlayField'
    | 'ScoreBoard'
    | 'TokenStore'
    | 'GridBoard'
    | 'Draggable'
    | 'Dice'
    | 'Timer'
    | 'SystemMessage';

export interface ComponentInfo {
    id: string;
    type: ComponentType;
    props: Record<string, any>;
}

export interface RoomInitPayload {
    state: RoomState;
    components: ComponentInfo[];
}