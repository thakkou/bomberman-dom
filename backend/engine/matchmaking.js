import * as state from "./globals.js";
import * as conf from "./config.js";
import { createRoom } from "./functions.js";
import { createGameState } from "./gameState.js";
import { broadcastQueueTimer, broadcastTimerCancelled, broadcastGameUpdate } from "../wsManager.js";

let queueTimer = null;
let queueEndsAt = null;

export function onQueueChanged() {
    const count = state.waitingQueue.length;

    if (count >= conf.PLAYERS_PER_ROOM) {
        cancelQueueTimer();
        lockAndCreateRoom(state.waitingQueue.splice(0, conf.PLAYERS_PER_ROOM));
        onQueueChanged(); // handle anyone left over beyond this batch immediately
        return;
    }

    if (count >= 2 && !queueTimer) { startQueueTimer(); return; }
    if (count < 2) cancelQueueTimer();
}

function startQueueTimer() {
    queueEndsAt = Date.now() + conf.QUEUE_WAIT_MS;
    broadcastQueueTimer(state.waitingQueue, queueEndsAt);

    queueTimer = setTimeout(() => {
        queueTimer = null;
        queueEndsAt = null;
        if (state.waitingQueue.length >= 2) {
            lockAndCreateRoom(state.waitingQueue.splice(0, conf.PLAYERS_PER_ROOM));
        }
    }, conf.QUEUE_WAIT_MS);
}

function cancelQueueTimer() {
    if (!queueTimer && queueEndsAt === null) return;
    if (queueTimer) clearTimeout(queueTimer);
    queueTimer = null;
    if (queueEndsAt !== null) broadcastTimerCancelled(state.waitingQueue, "queue_timer");
    queueEndsAt = null;
}

function lockAndCreateRoom(playerIds) {
    const room = createRoom(playerIds);
    room.state = "starting";
    room.game = createGameState(playerIds);        // map/spawns ready immediately
    room.countdownEndsAt = Date.now() + conf.COUNTDOWN_MS;

    state.rooms.set(room.id, room);
    for (const playerId of playerIds) state.playerRooms.set(playerId, room.id);

    room.countdownTimer = setTimeout(() => activateRoom(room.id), conf.COUNTDOWN_MS);
    broadcastGameUpdate(room); // roomState:"starting" → clients redirect to "/" right now
}

function activateRoom(roomId) {
    const room = state.rooms.get(roomId);
    if (!room) return;
    room.countdownTimer = null;
    room.state = "playing";
    broadcastGameUpdate(room); // roomState:"playing" → clients reveal the board
}

export function onPlayerLeftQueue() {
    onQueueChanged();
}

export function getQueueTimerStatus() {
    return { queueEndsAt };
}