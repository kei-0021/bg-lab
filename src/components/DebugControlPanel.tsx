// src/components/DebugControlPanel.jsx (または .tsx)

import React from 'react';

// propsの型定義 (TypeScriptの場合)

interface DebugControlPanelProps {
    players: any[]; // Playerの型を適切に指定してください
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
    debugPanelStyle: React.CSSProperties; // 親から受け取るスタイル
    inputStyle: React.CSSProperties; // 親から受け取るスタイル
}

React;

// TypeScriptを使用しない場合の関数コンポーネント
export default function DebugControlPanel({ 
    players, 
    myPlayerId,
    debugTargetId, 
    setDebugTargetId, 
    debugScoreAmount, 
    setDebugScoreAmount,
    handleDebugScore,
    debugResourceAmount,
    setDebugResourceAmount,
    handleDebugResource,
    RESOURCE_IDS,
    debugPanelStyle,
    inputStyle
}: DebugControlPanelProps) {
    
    // 💡 変更: 自分のプレイヤーのみをフィルタリング
    const myPlayer = players.find(p => p.id === myPlayerId);
    // <select>でマップするための配列。myPlayerが存在すればそれを含む配列にする
    const selectablePlayers = myPlayer ? [myPlayer] : [];

    return (
        // 5. 🛠️ デバッグコントロールパネル
        <div style={debugPanelStyle}>
            <p style={{ color: '#FFEB3B', fontSize: '1.1em', marginBottom: '8px' }}>🛠️ デバッグ/テストコントロール</p>
            
            {/* ターゲットプレイヤー表示（選択肢は自分だけ、固定表示） */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {myPlayer ? (
                <span style={{ ...inputStyle, display: 'inline-block', width: '180px', backgroundColor: 'rgba(0, 188, 212, 0.2)', padding: '4px 8px' }}>
                {myPlayer.name} (自分: {myPlayer.id.substring(0, 4)})
                </span>
            ) : (
                <span style={{ color: '#FFEB3B' }}>プレイヤーIDが見つかりません</span>
            )}
            </div>
            
            {/* スコア更新 (以下変更なし) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                    type="number" 
                    value={debugScoreAmount} 
                    onChange={(e) => setDebugScoreAmount(parseInt(e.target.value) || 0)}
                    style={inputStyle}
                />
                <button 
                    onClick={() => handleDebugScore(debugScoreAmount)}>
                    + スコア加算
                </button>
                <button 
                    onClick={() => handleDebugScore(-debugScoreAmount)}>
                    - スコア減算
                </button>
            </div>

            {/* リソース更新 (以下変更なし) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                    type="number" 
                    value={debugResourceAmount} 
                    onChange={(e) => setDebugResourceAmount(parseInt(e.target.value) || 0)}
                    style={inputStyle}
                />
                
                {/* 酸素 (Oxygen) */}
                <button 
                    onClick={() => handleDebugResource(RESOURCE_IDS.OXYGEN, debugResourceAmount)}>
                    酸素 +
                </button>
                <button 
                    onClick={() => handleDebugResource(RESOURCE_IDS.OXYGEN, -debugResourceAmount)}>
                    酸素 -
                </button>

                {/* バッテリー (Battery) */}
                <button 
                    onClick={() => handleDebugResource(RESOURCE_IDS.BATTERY, debugResourceAmount)}>
                    バッテリー +
                </button>
                <button 
                    onClick={() => handleDebugResource(RESOURCE_IDS.BATTERY, -debugResourceAmount)}>
                    バッテリー -
                </button>
            </div>
        </div>
    );
}