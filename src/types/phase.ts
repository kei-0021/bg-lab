// src/types/phase.ts
import { Phase } from "react-game-ui";

/**
 * 花火大会Ⅱのゲーム進行を管理するフェーズ定義
 */
export class FireworksⅡPhase extends Phase {
  /**
   * 【作戦フェーズ】
   * 演目カードやカラーカードを引き、今回の打ち上げ方針を決める段階。
   */
  static readonly PLANNING = new (class extends FireworksⅡPhase {
    readonly name = "planning";
  })();

  /**
   * 【準備フェーズ】
   * 手札から打ち上げる花火カード（最大3枚）を選び、場にセットする段階。
   */
  static readonly SETUP = new (class extends FireworksⅡPhase {
    readonly name = "setup";
  })();

  /**
   * 【評価フェーズ】
   * セットされたカードを公開し、演目との一致度や色を判定してスコアを算出する段階。
   */
  static readonly EVALUATION = new (class extends FireworksⅡPhase {
    readonly name = "evaluation";
  })();

  /**
   * 【待機フェーズ】
   * 次のラウンドへの待機段階。
   */
  static readonly WAITINGFORNEXTROUND = new (class extends FireworksⅡPhase {
    readonly name = "waitingfornextround";
  })();

  readonly name: string = "base";
}
