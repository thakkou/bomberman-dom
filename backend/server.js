import http from "node:http";

import * as conf from "./config.js";
import * as state from "./globals.js";
import * as bman from "./functions.js";
import { createWebSocketServer, broadcastToRoom, broadcastQueuePositions } from "./wsManager.js";

const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        bman.sendEmpty(res);
        return;
    }

    const url = new URL(
        req.url,
        `http://${req.headers.host}`
    );

    const pathname = url.pathname;
    const method = req.method;

    try {
        // Health
        if (method === "GET" && pathname === "/api/health") {
            bman.sendJson(res, 200, { status: "ok" });
            return;
        }

        // Join queue
        if (method === "POST" && pathname === "/api/players") {
            let data;

            try {
                data = await bman.readJsonBody(req);
            } catch {
                bman.sendError(res, 400, "Invalid JSON.");
                return;
            }

            // Validate nickname
            let nickname = data.nickname;
            if (typeof nickname !== "string") {
                bman.sendError(res, 400, "Nickname must be a string.");
                return;
            }

            nickname = nickname.trim();
            if (!nickname) {
                bman.sendError(res, 400, "Nickname is required.");
                return;
            } else if (nickname.length < 3 || nickname.length > 20) {
                bman.sendError(res, 400, "Nickname must be between 3 & 20 characters.");
                return;
            }


            // Check nickname uniqueness:
            // This check + insertion happens synchronously,
            // so another request cannot slip between the check and insertion.
            const nicknameTaken = [...state.players.values()].some(
                player => player.nickname.toLowerCase() === nickname.toLowerCase()
            );
            if (nicknameTaken) {
                bman.sendError(res, 409, "This nickname is already taken.");
                return;
            }

            // Create player
            const player = bman.createPlayer(nickname);
            state.players.set(player.id, player);

            // Add player to queue
            state.waitingQueue.push(player.id);

            // Try to create rooms
            const createdRooms = bman.processQueue();
            for (const room of createdRooms) broadcastToRoom(room);
            broadcastQueuePositions(state.waitingQueue); // refresh positions for everyone still waiting


            // Determine player's current state
            const roomId = state.playerRooms.get(player.id);

            if (roomId) {
                const room = bman.getRoom(roomId);
                bman.sendJson(res, 201, {
                    player,
                    status: "room",
                    roomId: room.id,
                    room: {
                        id: room.id,
                        state: room.state,
                        playerCount: room.players.length
                    }
                });
                return;
            }


            // Player is still waiting.
            const queuePosition = bman.getQueuePosition(player.id);
            bman.sendJson(res, 201, {
                player,
                status: "waiting",
                queuePosition
            });
            return;
        }


        // Player status
        const playerMatch = pathname.match(/^\/api\/players\/([^/]+)$/);

        if (method === "GET" && playerMatch) {
            const playerId = playerMatch[1];
            const player = bman.getPlayer(playerId);
            if (!player) {
                bman.sendError(res, 404, "Player not found.");
                return;
            }

            const roomId = state.playerRooms.get(playerId);
            if (roomId) {
                const room = bman.getRoom(roomId);
                bman.sendJson(res, 200, {
                    player,
                    status: "room",
                    roomId,
                    room: {
                        id: room.id,
                        state: room.state,
                        playerCount: room.players.length
                    }
                });
                return;
            }

            bman.sendJson(res, 200, {
                player,
                status: "waiting",
                queuePosition:
                    bman.getQueuePosition(playerId)
            });
            return;
        }

        // Leave queue / room
        if (method === "DELETE" && playerMatch) {
            const playerId = playerMatch[1];
            const player = bman.getPlayer(playerId);
            if (!player) {
                bman.sendError(res, 404, "Player not found.");
                return;
            }

            // Player is waiting
            const queueIndex = state.waitingQueue.indexOf(playerId);
            if (queueIndex !== -1) {
                state.waitingQueue.splice(queueIndex, 1);
                state.players.delete(playerId);
                bman.sendJson(res, 200, { success: true });
                return;
            }


            // Player is inside a room
            const roomId = state.playerRooms.get(playerId);

            if (roomId) {
                const room = bman.getRoom(roomId);

                if (room) {
                    const index = room.players.indexOf(playerId);
                    if (index !== -1) {
                        room.players.splice(index, 1);
                    }
                    if (room.players.length === 0) {
                        state.rooms.delete(roomId);
                    }
                }

                state.playerRooms.delete(playerId);
                state.players.delete(playerId);

                bman.sendJson(res, 200, {
                    success: true,
                    roomId
                });
                return;
            }


            // Player exists but isn't queued or in a room.
            state.players.delete(playerId);
            bman.sendJson(res, 200, {
                success: true
            });
            return;
        }


        // Start room
        const startRoomMatch = pathname.match(
            /^\/api\/rooms\/([^/]+)\/start$/
        );

        if (method === "POST" && startRoomMatch) {
            const roomId = startRoomMatch[1];
            const room = bman.getRoom(roomId);

            if (!room) {
                bman.sendError(res, 404, "Room not found.");
                return;
            }

            if (room.players.length !== conf.PLAYERS_PER_ROOM) {
                bman.sendError(res, 409, "Room does not have enough players.");
                return;
            }

            room.state = "playing";
            bman.sendJson(res, 200, {
                success: true,
                room: {
                    id: room.id,
                    state: room.state
                }
            });
            return;
        }


        // Room
        const roomMatch = pathname.match(
            /^\/api\/rooms\/([^/]+)$/
        );

        if (method === "GET" && roomMatch) {
            const roomId = roomMatch[1];
            const room = bman.getRoom(roomId);
            if (!room) {
                bman.sendError(res, 404, "Room not found.");
                return;
            }

            bman.sendJson(res, 200, {
                room: {
                    id: room.id,
                    state: room.state,
                    createdAt: room.createdAt,
                    players: bman.getRoomPlayers(room)
                }
            });
            return;
        }

        // All players
        if (method === "GET" && pathname === "/api/players") {
            bman.sendJson(res, 200, {
                players: [...state.players.values()]
            });
            return;
        }

        // Unknown endpoint
        bman.sendError(res, 404, "Endpoint not found.");

    } catch (error) {
        console.error(error);
        bman.sendError(res, 500, "Internal server error.");
    }
});

createWebSocketServer(server);

server.listen(conf.PORT, conf.HOST, () => {
    console.log(`BACKEND: http://${conf.HOST}:${conf.PORT}`);
});