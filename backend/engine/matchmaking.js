import * as state from "./globals.js";
import * as conf from "./config.js";
import { createRoom } from "./functions.js";
import { createGameState } from "./gameState.js";
import { broadcastQueueTimer, broadcastCountdown, broadcastTimerCancelled, broadcastGameUpdate } from "../wsManager.js";

// Only the still-open waitingQueue has a single timer — there's only ever one "forming" batch.
let queueTimer = null;
let queueEndsAt = null;

// Once a batch locks, it counts down independently of whatever forms behind it.
const pendingBatches = new Map(); // batchId -> { playerIds, countdownTimer, countdownEndsAt }
let nextBatchId = 1;

export function onQueueChanged() {
    const count = state.waitingQueue.length;

    if (count >= conf.PLAYERS_PER_ROOM) {
        cancelQueueTimer();
        lockBatch(state.waitingQueue.splice(0, conf.PLAYERS_PER_ROOM));
        onQueueChanged(); // recurse: handle anyone left over beyond this batch immediately
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
            lockBatch(state.waitingQueue.splice(0, conf.PLAYERS_PER_ROOM));
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

function lockBatch(playerIds) {
    const batchId = nextBatchId++;
    const countdownEndsAt = Date.now() + conf.COUNTDOWN_MS;
    const countdownTimer = setTimeout(() => formAndStartRoom(batchId), conf.COUNTDOWN_MS);

    pendingBatches.set(batchId, { playerIds, countdownTimer, countdownEndsAt });
    for (const playerId of playerIds) state.playerBatches.set(playerId, batchId);
    broadcastCountdown(playerIds, countdownEndsAt);
}

function formAndStartRoom(batchId) {
    const batch = pendingBatches.get(batchId);
    if (!batch) return;
    pendingBatches.delete(batchId);
    for (const playerId of batch.playerIds) state.playerBatches.delete(playerId);

    if (batch.playerIds.length >= 2) {
        const room = createRoom(batch.playerIds);
        state.rooms.set(room.id, room);
        for (const playerId of batch.playerIds) state.playerRooms.set(playerId, room.id);

        room.state = "playing";
        room.game = createGameState(batch.playerIds);
        broadcastGameUpdate(room);
    }
}

export function onPlayerLeftQueue() {
    onQueueChanged();
}

export function onLockedPlayerLeft(playerId) {
    const batchId = state.playerBatches.get(playerId);
    if (batchId === undefined) return false;

    const batch = pendingBatches.get(batchId);
    if (!batch) return false;

    const index = batch.playerIds.indexOf(playerId);
    if (index !== -1) batch.playerIds.splice(index, 1);
    state.playerBatches.delete(playerId);

    if (batch.playerIds.length < 2) {
        clearTimeout(batch.countdownTimer);
        pendingBatches.delete(batchId);
        broadcastTimerCancelled(batch.playerIds, "countdown");
        for (const remainingId of batch.playerIds) state.playerBatches.delete(remainingId);
        state.waitingQueue.unshift(...batch.playerIds);
        onQueueChanged();
    }
    return true;
}

// Scoped to the specific player — never leaks another batch's countdown to them.
export function getMatchmakingStatusFor(playerId) {
    const batchId = state.playerBatches.get(playerId);
    if (batchId !== undefined) {
        const batch = pendingBatches.get(batchId);
        if (batch) return { queueEndsAt: null, countdownEndsAt: batch.countdownEndsAt };
    }
    return { queueEndsAt, countdownEndsAt: null };
}

// import * as state from "./globals.js";
// import * as conf from "./config.js";
// import { createRoom } from "./functions.js";
// import { createGameState } from "./gameState.js";
// import { broadcastQueueTimer, broadcastCountdown, broadcastTimerCancelled, broadcastGameUpdate } from "../wsManager.js";

// let queueTimer = null;
// let countdownTimer = null;
// let queueEndsAt = null;
// let countdownEndsAt = null;
// let lockedPlayerIds = null; // pulled out of the queue already, counting down toward room creation

// export function onQueueChanged() {
//     if (lockedPlayerIds) return; // a batch is already locked in — leave it alone until it resolves

//     const count = state.waitingQueue.length;

//     if (count >= conf.PLAYERS_PER_ROOM) {
//         cancelQueueTimer();
//         lockPlayersAndStartCountdown(state.waitingQueue.splice(0, conf.PLAYERS_PER_ROOM));
//         return;
//     }

//     if (count >= 2 && !queueTimer) { startQueueTimer(); return; }
//     if (count < 2) cancelQueueTimer();
// }

// function startQueueTimer() {
//     queueEndsAt = Date.now() + conf.QUEUE_WAIT_MS;
//     broadcastQueueTimer(state.waitingQueue, queueEndsAt);

//     queueTimer = setTimeout(() => {
//         queueTimer = null;
//         queueEndsAt = null;
//         if (state.waitingQueue.length >= 2) {
//             lockPlayersAndStartCountdown(state.waitingQueue.splice(0, conf.PLAYERS_PER_ROOM));
//         }
//     }, conf.QUEUE_WAIT_MS);
// }

// function cancelQueueTimer() {
//     if (!queueTimer && queueEndsAt === null) return;
//     if (queueTimer) clearTimeout(queueTimer);
//     queueTimer = null;
//     if (queueEndsAt !== null) broadcastTimerCancelled(state.waitingQueue, "queue_timer");
//     queueEndsAt = null;
// }

// function lockPlayersAndStartCountdown(playerIds) {
//     lockedPlayerIds = playerIds; // spliced out of waitingQueue already — no one else can join this batch
//     countdownEndsAt = Date.now() + conf.COUNTDOWN_MS;
//     broadcastCountdown(lockedPlayerIds, countdownEndsAt);

//     countdownTimer = setTimeout(() => {
//         countdownTimer = null;
//         countdownEndsAt = null;
//         formAndStartRoom();
//     }, conf.COUNTDOWN_MS);
// }

// function formAndStartRoom() {
//     const playerIds = lockedPlayerIds;
//     lockedPlayerIds = null;

//     if (playerIds.length >= 2) {
//         const room = createRoom(playerIds);
//         state.rooms.set(room.id, room);
//         for (const playerId of playerIds) state.playerRooms.set(playerId, room.id);

//         room.state = "playing";
//         room.game = createGameState(playerIds);
//         broadcastGameUpdate(room);
//     }

//     onQueueChanged(); // pick up anyone left waiting (or who joined during the countdown)
// }

// // A still-queued (not yet locked) player left.
// export function onPlayerLeftQueue() {
//     onQueueChanged();
// }

// // A locked-in (counting down) player left before the room was created.
// export function onLockedPlayerLeft(playerId) {
//     if (!lockedPlayerIds) return false;
//     const index = lockedPlayerIds.indexOf(playerId);
//     if (index === -1) return false;

//     lockedPlayerIds.splice(index, 1);

//     if (lockedPlayerIds.length < 2) {
//         clearTimeout(countdownTimer);
//         countdownTimer = null;
//         broadcastTimerCancelled(lockedPlayerIds, "countdown");
//         state.waitingQueue.unshift(...lockedPlayerIds); // put remaining player(s) back in queue
//         lockedPlayerIds = null;
//         countdownEndsAt = null;
//         onQueueChanged();
//     }
//     return true;
// }

// export function getMatchmakingStatus() {
//     return { queueEndsAt, countdownEndsAt };
// }