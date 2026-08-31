import { PLAYERS_PER_ROOM } from "../engine/config.js";
import { createGameState } from "../engine/gameState.js";
import * as bman from "../engine/functions.js";
import * as json from "../json.js";
import { broadcastGameUpdate } from "../wsManager.js";

export function registerRoomRoutes(route) {
    route("GET", "/api/rooms/:id", handleGetRoom);
    route("POST", "/api/rooms/:id/start", handleStartRoom);
}

function handleGetRoom(req, res, { params }) {
    const room = bman.getRoom(params.id);
    if (!room) { json.sendError(res, 404, "Room not found."); return; }

    json.sendJson(res, 200, {
        room: {
            id: room.id,
            state: room.state,
            createdAt: room.createdAt,
            players: bman.getRoomPlayers(room)
        }
    });
}

function handleStartRoom(req, res, { params }) {
    const room = bman.getRoom(params.id);
    if (!room) { json.sendError(res, 404, "Room not found."); return; }

    if (room.players.length !== PLAYERS_PER_ROOM) {
        json.sendError(res, 409, "Room does not have enough players.");
        return;
    }

    room.state = "playing";
    room.game = createGameState(room.players); // +
    json.sendJson(res, 200, {
        success: true,
        room: { id: room.id, state: room.state }
    });
    broadcastGameUpdate(room); // push the initial board to everyone immediately
}