// pubilc/data/customEvents.ts
export function customEvents() {
    return {
        "reset:draggable": (socket, data) => {
            const { roomId } = data;
            socket.to(roomId).emit("reset:draggable");
            socket.emit("reset:draggable");
        },
    };
}
