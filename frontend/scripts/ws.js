// frontend/scripts/ws.js
const WS_BASE = "ws://localhost:8080/ws";
let socket = null;

export function connectWebSocket(playerId, handlers = {}) {
    socket = new WebSocket(`${WS_BASE}?playerId=${encodeURIComponent(playerId)}`);

    socket.addEventListener("open", () => {
        console.log('open')
        handlers.onOpen?.()
    });
    socket.addEventListener("close", () => {
        console.log('close')
        handlers.onClose?.()
    });
    socket.addEventListener("error", (err) => {
        console.log('error')
        handlers.onError?.(err)
    });
    socket.addEventListener("message", (event) => {
        console.log('message')
        let payload;
        try {
            payload = JSON.parse(event.data);
        } catch {
            return;
        }
        if (payload.type === "room_update") handlers.onRoomUpdate?.(payload.room);
        if (payload.type === "queue_update") handlers.onQueueUpdate?.(payload.queuePosition);
        if (payload.type === "game_update") handlers.onGameUpdate?.(payload.game, payload.roomState, payload.countdownEndsAt);
        if (payload.type === "queue_timer") handlers.onQueueTimer?.(payload.endsAt);
        if (payload.type === "countdown") handlers.onCountdown?.(payload.endsAt);
        if (payload.type === "timer_cancelled") handlers.onTimerCancelled?.(payload.timer);
        if (payload.type === "opponents_left") handlers.onOpponentsLeft?.();

        if (payload.type === "chat_message") handlers.onChatMessage?.(payload.message);
        if (payload.type === "chat_history") handlers.onChatHistory?.(payload.messages);
        if (payload.type === "chat_error") handlers.onChatError?.(payload.error);
    });

    return socket;
}

export function sendGameAction(action) {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(action));
}

export function closeWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    socket = null;
}

export function sendChatMessage(text) {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "chat", text }));
}

// window.addEventListener("beforeunload", closeWebSocket);