"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function Game() {
    return createElement(
        "section",
        { class: "main-container", "aria-label": "Bomberman game" },
        {},
        // header component
        createElement(
            "header",
            { class: "lives-and-score-container" },
            {},
            createElement("div", { class: "hud-players", id: "hud-players" }, {}),
            // createElement("div", { class: "game-title" }, {}, "BOMBERMAN"),
            // createElement("span", {}, {}, "Bombs: "),
            // createElement("span", { id: "bomb-count" }, {}, "1"),
            // createElement("span", {}, {}, "Range: "),
            // createElement("span", { id: "blast-range" }, {}, "2"),
            // createElement("span", {}, {}, "Speed: "),
            // createElement("span", { id: "speed-level" }, {}, "0"),
        //     createElement(
        //         "div",
        //         { class: "game-stats" },
        //         {},
        //         createElement(
        //             "div",
        //             { class: "stat-card lives-card" },
        //             {},
        //             createElement("span", { class: "stat-icon", "aria-hidden": "true" }, {}, "♥"),
        //             createElement(
        //                 "span",
        //                 { class: "stat-text" },
        //                 {},
        //                 createElement("span", { class: "stat-label" }, {}, "Lives"),
        //                 createElement("span", { class: "stat-value", id: "lives" }, {}, "3"),
        //             ),
        //         ),
        //         createElement(
        //             "div",
        //             { class: "stat-card score-card" },
        //             {},
        //             createElement("span", { class: "stat-icon", "aria-hidden": "true" }, {}, "★"),
        //             createElement(
        //                 "span",
        //                 { class: "stat-text" },
        //                 {},
        //                 createElement("span", { class: "stat-label" }, {}, "Score"),
        //                 createElement("span", { class: "stat-value", id: "score" }, {}, "0"),
        //             ),
        //         ),
        //     ),
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