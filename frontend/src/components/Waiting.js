"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";
import waitingState from "../state/waitingState.js";

import LeaveBtn from "./LeaveBtn.js";

export default function Waiting() {
    const { playerCount, timerLabel, secondsLeft } = waitingState.getState();

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
            createElement("span", {}, {}, String(playerCount)),
            createElement("span", { class: "player-total" }, {}, "/ 4"),
        ),
        createElement("p", { class: "counter-label" }, {}, "Players joined"),
        secondsLeft !== null
            ? createElement("p", { class: "waiting-status", "aria-live": "polite" }, {}, `${timerLabel} ${secondsLeft}s`)
            : null,
        LeaveBtn()
    );
}