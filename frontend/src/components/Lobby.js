"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";
import { joinQueue } from "../services/api.js";
import { router } from "../main.js";
import lobbyState from "../state/lobbyState.js";

async function joinGame(event) {
    event.preventDefault();

    const existingPlayerId = localStorage.getItem("bomberman:playerId");
    if (existingPlayerId) {
        // Another tab already created a player for this browser while this
        // form was open — don't create a duplicate, just follow them there.
        router.navigate("/waiting");
        return;
    }

    const input = document.getElementById("nickname");
    const nickname = input.value.trim();
    lobbyState.setState({ error: "" });

    try {
        const data = await joinQueue(nickname);
        localStorage.setItem("bomberman:playerId", data.player.id);
        localStorage.setItem("bomberman:nickname", nickname);
        router.navigate("/waiting");
    } catch (err) {
        lobbyState.setState({ error: err.message });
    }
}

export default function Lobby() {
    const { error } = lobbyState.getState();

    return createElement(
        "section",
        { class: "lobby-container", "aria-label": "Enter nickname" },
        {},
        createElement("h1", { class: "lobby-title" }, {}, "BOMBERMAN"),
        createElement("p", { class: "lobby-subtitle" }, {}, "Enter your nickname to join the game."),
        error
            ? createElement("p", { class: "lobby-error", "aria-live": "polite" }, {}, error)
            : null,
        createElement(
            "form",
            { class: "nickname-form" },
            { submit: joinGame },
            createElement("label", { for: "nickname" }, {}, "Nickname"),
            createElement("input", {
                id: "nickname", name: "nickname", type: "text", maxlength: "20", minlength: "1",
                placeholder: "Enter your nickname...", autocomplete: "nickname", required: "true", autofocus: "true",
            }, {}),
            createElement("button", { type: "submit" }, {}, "Join Game"),
        ),
    );
}