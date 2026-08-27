import http from "node:http";

import * as conf from "./config.js";
import * as json from "./json.js";

import { createRouter } from "./router.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPlayerRoutes } from "./routes/players.js";
import { registerRoomRoutes } from "./routes/rooms.js";
import { createWebSocketServer } from "./wsManager.js";

const { route, dispatch } = createRouter();

registerHealthRoutes(route);
registerPlayerRoutes(route);
registerRoomRoutes(route);

const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        json.sendEmpty(res);
        return;
    }

    try {
        const handled = await dispatch(req, res);
        if (!handled) json.sendError(res, 404, "Endpoint not found.");
    } catch (error) {
        console.error(error);
        json.sendError(res, 500, "Internal server error.");
    }
});

createWebSocketServer(server);

server.listen(conf.PORT, conf.HOST, () => {
    console.log(`BACKEND: http://${conf.HOST}:${conf.PORT}`);
});