import crypto from "node:crypto";

import * as state from "./globals.js";
import { PLAYERS_PER_ROOM } from "./config.js";

// ============================================================
// Utility functions
// ============================================================

export function createPlayer(nickname) {
    return {
        id: crypto.randomUUID(),
        nickname,
        lives: 3,
        score: 0
    };
}

export function createRoom(roomPlayers) {
    return {
        id: crypto.randomUUID(),
        players: roomPlayers,
        state: "waiting",
        createdAt: Date.now()
    };
}

export function getRoom(roomId) {
    return state.rooms.get(roomId);
}

export function getPlayer(playerId) {
    return state.players.get(playerId);
}

export function getQueuePosition(playerId) {
    const index = state.waitingQueue.indexOf(playerId);
    if (index === -1) return null;
    return index + 1;
}

export function getRoomPlayers(room) {
    return room.players.map(playerId => {
        return getPlayer(playerId);
    });
}


// ============================================================
// Queue
// ============================================================

// export function processQueue() {
//     // This function contains no await.
//     // Therefore the entire operation runs synchronously.
//     // Node.js cannot execute another request in the middle of this function.
//     // This is what makes checking the queue + removing players
//     // + creating rooms effectively atomic.
//     const createdRooms = [];
//     while (state.waitingQueue.length >= PLAYERS_PER_ROOM) {
//         const playerIds = state.waitingQueue.splice(0, PLAYERS_PER_ROOM);
//         const room = createRoom(playerIds);

//         state.rooms.set(room.id, room);
//         for (const playerId of playerIds) {
//             state.playerRooms.set(playerId, room.id);
//         }
//         createdRooms.push(room);
//         console.log(`Created room ${room.id} with ${playerIds.length} players`);
//     }
//     return createdRooms;
// }