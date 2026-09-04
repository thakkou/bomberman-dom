import { PLAYERS_PER_ROOM } from "../engine/config.js";
import { createGameState } from "../engine/gameState.js";
import * as bman from "../engine/functions.js";
import * as json from "../json.js";
import { broadcastGameUpdate } from "../services/wsManager.js";

export function registerRoomRoutes(route) {
    route("GET", "/api/rooms/:id", handleGetRoom);
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