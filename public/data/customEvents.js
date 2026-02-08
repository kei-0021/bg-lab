// pubilc/data/customEvents.js

export function customEvents() {
  return {
    "draggable:moved": (socket, data) => {
        const { roomId, ...move } = data;
        // 1. ルーム内全員にブロードキャスト (送信元ソケットは除く)
        socket.to(roomId).emit("draggable:update", move);
    },

    "reset:draggable": (socket, data) => {
        const { roomId } = data;
        // 送信元を除くルーム全員にリセット通知をブロードキャスト
        socket.to(roomId).emit("reset:draggable");
    },
    
    // ★ カーソル同期のイベントハンドラーを追加
    "cursor:move": (socket, data) => {
        const { roomId, x, y } = data;
        
        // 送信元ソケットのIDを取得
        const playerId = socket.id;

        // ルーム内の他のクライアントにカーソル座標をブロードキャスト
        // クライアント側で 'cursor:update' イベントとして受信されます
        socket.to(roomId).emit("cursor:update", { 
            playerId, // 誰のカーソルか識別するためにIDを含める
            x,        // 画面のX座標 (clientX)
            y,        // 画面のY座標 (clientY)
        });
    },
  };
}