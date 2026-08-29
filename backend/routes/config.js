import * as json from "../json.js";
import * as conf from "../engine/config.js";

export function registerConfigRoutes(route) {
    route("GET", "/api/config", (req, res) => {
        json.sendJson(res, 200, conf);
        // {
        //     PLAYERS_PER_ROOM: conf.PLAYERS_PER_ROOM,
        //     BOARD_COLUMNS: conf.BOARD_COLUMNS,
        //     BOARD_SIZE: conf.BOARD_SIZE,
        //     START_POSITION: conf.START_POSITION,
        //     STARTING_LIVES: conf.STARTING_LIVES,
        //     BOX_SCORE: conf.BOX_SCORE,
        //     BOMB_DELAY: conf.BOMB_DELAY,
        //     EXPLOSION_TIME: conf.EXPLOSION_TIME,
        //     BLAST_RANGE: conf.BLAST_RANGE,
        // });
    });
}