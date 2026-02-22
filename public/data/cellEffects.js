export const cellEffects = {
  // 探索者が見つけたレリックタイル (💎)
  "Relic Site": ({ updateResource, playerId }) => {
    // ✅ playerId を追加
    // プレイヤーのリソースID 'artifact' に +1 する
    if (playerId) {
      updateResource(playerId, "ARTIFACT", 1);
    }
  },
  // 資源（エネルギー）が豊富なタイル (🫧)
  "Energy Vein": ({ updateResource, playerId }) => {
    // ✅ playerId を追加
    // プレイヤーのリソースID 'OXYGEN' に +2 する
    if (playerId) {
      updateResource(playerId, "OXYGEN", 20);
    }
  },
  // 危険な荒地タイル（🌋） (ペナルティ)
  "特殊地形 (火山)": ({ updateResource, playerId }) => {
    // ✅ playerId を追加
    if (playerId) {
      updateResource(playerId, "OXYGEN", -100);
      updateResource(playerId, "BATTERY", -100);
    }
  },
  // 何も起こらない空のタイル（色分けされた普通のマス）
  "Empty Deep Sea": () => {
    // 効果なし。ログを残すことでデバッグを容易にする
    console.log("🌊 Empty Deep Sea: 海は静かだ");
  },
  // ランドマークタイル (🔱)
  "Abyss Landmark": ({ updateResource, playerId }) => {
    // ✅ playerId を追加
    if (playerId) {
      updateResource(playerId, "ARTIFACT", 5);
    }
  },
};
