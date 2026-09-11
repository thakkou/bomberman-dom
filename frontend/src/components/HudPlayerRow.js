"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function HudPlayerRow(playerId, player, i, myPlayerId) {
    const classes = ["hud-player", `player-${i}`];
    if (playerId === myPlayerId) classes.push("hud-player-me");
    if (!player.alive) classes.push("hud-player-dead");
    return createElement("div", { class: classes.join(" ") }, {},
        createElement("span", { class: "hud-name" }, {}, playerId === myPlayerId ? "You" : player.nickname),
        createElement("span", { class: "hud-lives" }, {}, "❤".repeat(Math.max(0, player.lives))),
        createElement("span", { class: "hud-score" }, {}, `${player.score} pts`),
    );
}