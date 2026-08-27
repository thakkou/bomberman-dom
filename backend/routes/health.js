import * as json from "../json.js";

export function registerHealthRoutes(route) {
    route("GET", "/api/health", (req, res) => {
        json.sendJson(res, 200, { status: "ok" });
    });
}