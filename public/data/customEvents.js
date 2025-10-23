// pubilc/data/customEvents.s の修正後

export function customEvents() {
  return {
    "draggable:moved": (socket, data) => {
        const { roomId, ...move } = data;
        // 1. ルーム内全員にブロードキャスト (送信元ソケットは除く)
        socket.to(roomId).emit("draggable:update", move);
    },
  };
}