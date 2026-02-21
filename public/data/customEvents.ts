// pubilc/data/customEvents.ts

export function customEvents(): Record<string, (socket: any, data: any) => void> {
  return {
    "reset:draggable": (socket: any, data: any) => {
      const { roomId } = data;

      socket.to(roomId).emit("reset:draggable");
      socket.emit("reset:draggable");
    },
    "playfield:switch": (socket: any, data: any) => {
      const { roomId } = data;

      socket.to(roomId).emit("playfield:switch");
      socket.emit("playfield:switch");
    },
  };
}