// src/types/phase.ts
import { Phase } from "react-game-ui";

export class FireworksⅡPhase extends Phase {
    static readonly PLANNING = new (class extends FireworksⅡPhase {
        readonly name = 'planning';
    })();
    static readonly SETUP = new (class extends FireworksⅡPhase {
        readonly name = 'setup';
    })();
    static readonly FINAL = new (class extends FireworksⅡPhase {
        readonly name = 'final';
    })();

    // abstract 対策のベース定義
    readonly name: string = 'base';
}
