// pubilc/data/customEvents.s の修正後

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
  };
}