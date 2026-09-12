"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function GameResult(message) {
    if (!message) return null;

    return createElement(
        "p",
        { class: "game-result", role: "status" },
        {},
        message
    );
}
