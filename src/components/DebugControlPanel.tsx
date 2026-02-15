// src/components/DebugControlPanel.tsx

interface DebugControlPanelProps {
  players: any[];
  myPlayerId: string | null;
  debugTargetId: string | null;
  setDebugTargetId: (id: string) => void;
  debugScoreAmount: number;
  setDebugScoreAmount: (amount: number) => void;
  handleDebugScore: (amount: number) => void;
  debugResourceAmount: number;
  setDebugResourceAmount: (amount: number) => void;
  handleDebugResource: (resourceId: string, amount: number) => void;
  RESOURCE_IDS: { OXYGEN: string; BATTERY: string };
  debugPanelClassName?: string;
  debugInputClassName?: string;
}

export default function DebugControlPanel({
  players,
  myPlayerId,
  debugScoreAmount,
  setDebugScoreAmount,
  handleDebugScore,
  debugResourceAmount,
  setDebugResourceAmount,
  handleDebugResource,
  RESOURCE_IDS,
  debugPanelClassName,
  debugInputClassName,
}: DebugControlPanelProps) {
  const myPlayer = players.find((p) => p.id === myPlayerId);

  return (
    <div className={debugPanelClassName}>
      <p style={{ color: "#FFEB3B", fontSize: "1.1em", marginBottom: "8px" }}>
        🛠️ デバッグ/テストコントロール
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {myPlayer ? (
          <span
            className={debugInputClassName}
            style={{
              display: "inline-block",
              width: "220px",
              backgroundColor: "rgba(0, 188, 212, 0.2)",
              padding: "4px 8px",
            }}
          >
            {myPlayer.name} (自分: {myPlayer.id.substring(0, 4)})
          </span>
        ) : (
          <span style={{ color: "#FFEB3B" }}>プレイヤーIDが見つかりません</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="number"
          value={debugScoreAmount}
          onChange={(e) => setDebugScoreAmount(parseInt(e.target.value) || 0)}
          className={debugInputClassName}
        />
        <button onClick={() => handleDebugScore(debugScoreAmount)}>
          + スコア加算
        </button>
        <button onClick={() => handleDebugScore(-debugScoreAmount)}>
          - スコア減算
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="number"
          value={debugResourceAmount}
          onChange={(e) =>
            setDebugResourceAmount(parseInt(e.target.value) || 0)
          }
          className={debugInputClassName}
        />

        <button
          onClick={() =>
            handleDebugResource(RESOURCE_IDS.OXYGEN, debugResourceAmount)
          }
        >
          酸素 +
        </button>
        <button
          onClick={() =>
            handleDebugResource(RESOURCE_IDS.OXYGEN, -debugResourceAmount)
          }
        >
          酸素 -
        </button>

        <button
          onClick={() =>
            handleDebugResource(RESOURCE_IDS.BATTERY, debugResourceAmount)
          }
        >
          バッテリー +
        </button>
        <button
          onClick={() =>
            handleDebugResource(RESOURCE_IDS.BATTERY, -debugResourceAmount)
          }
        >
          バッテリー -
        </button>
      </div>
    </div>
  );
}
