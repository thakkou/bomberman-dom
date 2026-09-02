import { createElement } from "mini-framework/src/vdom/index.js";

export default function Waiting() {
    return createElement(
        "section",
        { class: "waiting-container", "aria-label": "Waiting room" },
        {},
        createElement("h1", { class: "waiting-title" }, {}, "BOMBERMAN"),
        createElement("p", { class: "waiting-subtitle" }, {}, "Waiting for other players..."),
        createElement(
            "div",
            { class: "player-counter", "aria-live": "polite" },
            {},
            createElement("span", { id: "player-count" }, {}, "1"),
            createElement("span", { class: "player-total" }, {}, "/ 4")
        ),
        createElement("p", { class: "counter-label" }, {}, "Players joined"),
        createElement(
            "p",
            { class: "waiting-status" },
            {},
            createElement("p", { class: "queue-timer", id: "queue-timer", "aria-live": "polite" }, {}, ""),
            createElement("p", { class: "countdown-timer", id: "countdown-timer", "aria-live": "polite" }, {}, ""),
            // "The game will start when ",
            // createElement("span", {}, {}, "4 players"),
            // " have joined."
        ),
        createElement("button", { id: "leave-waiting", type: "button" }, {}, "Leave")
    );
}