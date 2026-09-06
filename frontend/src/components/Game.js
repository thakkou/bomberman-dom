"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function Game() {
    return createElement(
        "section",
        { class: "main-container", "aria-label": "Bomberman game" },
        {},
        createElement(
            "header",
            { class: "game-header" },
            {},
            createElement(
                "div",
                { class: "hud" },
                {},
                createElement("div", { class: "hud-players", id: "hud-players" }, {}),
                createElement("div", { class: "hud-powerups-bar", id: "hud-powerups-bar" }, {}),
            ),
        ),
        createElement(
            "div",
            { class: "game-container" },
            {},
            createElement(
                "div",
                { class: "border-line" },
                {},
                createElement("div", { class: "map-game", id: "map-game", style: "display:none;" }, {}),
                createElement("div", { class: "start-countdown", id: "start-countdown" }, {}, "Get ready...")
            ),
        ),
    );
}