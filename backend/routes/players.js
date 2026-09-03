import * as state from "../engine/globals.js";
import * as bman from "../engine/functions.js";
import * as json from "../json.js";
import { broadcastGameUpdate, broadcastOpponentsLeft, broadcastQueuePositions } from "../wsManager.js";
import * as matchmaking from "../engine/matchmaking.js";

export function registerPlayerRoutes(route) {
    route("POST", "/api/players", handleJoin);
    route("GET", "/api/players", handleListPlayers);
    route("GET", "/api/players/:id", handleGetPlayer);
    route("DELETE", "/api/players/:id", handleLeavePlayer);
}

async function handleJoin(req, res) {
    let data;
    try {
        data = await json.readJsonBody(req);
    } catch {
        json.sendError(res, 400, "Invalid JSON.");
        return;
    }
    
    // Validate nickname
    let nickname = data.nickname;
    if (typeof nickname !== "string") {
        json.sendError(res, 400, "Nickname must be a string.");
        return;
    }

    nickname = nickname.trim();
    if (!nickname) {
        json.sendError(res, 400, "Nickname is required.");
        return;
    } else if (nickname.length < 3 || nickname.length > 20) {
        json.sendError(res, 400, "Nickname must be between 3 & 20 characters.");
        return;
    }

    // Check nickname uniqueness:
    // This check + insertion happens synchronously,
    // so another request cannot slip between the check and insertion.
    const nicknameTaken = state.waitingQueue.some(playerId => {
        const queuedPlayer = bman.getPlayer(playerId);
        return queuedPlayer?.nickname.toLowerCase() === nickname.toLowerCase();
    });
    if (nicknameTaken) {
        json.sendError(res, 409, "This nickname is already taken.");
        return;
    }

    // Create player
    const player = bman.createPlayer(nickname);
    state.players.set(player.id, player);
    // Add player to queue
    state.waitingQueue.push(player.id);

    // UPDATED
    matchmaking.onQueueChanged();

    json.sendJson(res, 201, {
        player,
        status: "waiting",
        queuePosition: bman.getQueuePosition(player.id)
    });
    return;
    // (room-formation branch is gone — a fresh joiner is always "waiting" now;
    //  the room shows up later via the "game_update" WS message)

    // Try to create rooms
    // const createdRooms = bman.processQueue();
    // for (const room of createdRooms) broadcastToRoom(room);
    // broadcastQueuePositions(state.waitingQueue); // refresh positions for everyone still waiting


    // Determine player's current state
    // const roomId = state.playerRooms.get(player.id);
    // if (roomId) {
    //     const room = bman.getRoom(roomId);
    //     json.sendJson(res, 201, {
    //         player,
    //         status: "room",
    //         roomId: room.id,
    //         room: { id: room.id, state: room.state, playerCount: room.players.length }
    //     });
    //     return;
    // }

    // Player is still waiting.
    // json.sendJson(res, 201, {
    //     player,
    //     status: "waiting",
    //     queuePosition: bman.getQueuePosition(player.id)
    // });
}

function handleGetPlayer(req, res, { params }) {
    const player = bman.getPlayer(params.id);
    if (!player) { json.sendError(res, 404, "Player not found."); return; }

    const roomId = state.playerRooms.get(params.id);
    if (roomId) {
        const room = bman.getRoom(roomId);
        json.sendJson(res, 200, {
            player,
            status: "room",
            roomId,
            room: { id: room.id, state: room.state, playerCount: room.players.length }
        });
        return;
    }

    json.sendJson(res, 200, {
        player,
        status: "waiting",
        queuePosition: bman.getQueuePosition(params.id)
    });
}

function handleLeavePlayer(req, res, { params }) {
    const playerId = params.id;
    const player = bman.getPlayer(playerId);
    if (!player) { json.sendError(res, 404, "Player not found."); return; }

    const queueIndex = state.waitingQueue.indexOf(playerId);
    if (queueIndex !== -1) {
        state.waitingQueue.splice(queueIndex, 1);
        state.players.delete(playerId);
        matchmaking.onPlayerLeftQueue();
        json.sendJson(res, 200, { success: true });
        return;
    }

    const roomId = state.playerRooms.get(playerId);
    if (roomId) {
        const room = bman.getRoom(roomId);
        state.playerRooms.delete(playerId);
        state.players.delete(playerId);

        if (room) {
            const index = room.players.indexOf(playerId);
            if (index !== -1) room.players.splice(index, 1);
            if (room.game?.players) delete room.game.players[playerId];

            if (room.players.length === 0) {
                if (room.countdownTimer) clearTimeout(room.countdownTimer);
                state.rooms.delete(room.id);
            } else if (room.players.length === 1 && room.state !== "finished") {
                const lastPlayerId = room.players[0];
                if (room.countdownTimer) clearTimeout(room.countdownTimer);
                broadcastOpponentsLeft(lastPlayerId);
                state.playerRooms.delete(lastPlayerId);
                state.players.delete(lastPlayerId);
                state.rooms.delete(room.id);
            } else {
                broadcastGameUpdate(room);
            }
        }

        json.sendJson(res, 200, { success: true, roomId });
        return;
    }

    state.players.delete(playerId);
    json.sendJson(res, 200, { success: true });
}

function handleListPlayers(req, res) {
    json.sendJson(res, 200, {
        players: [...state.players.values()]
    });
}