"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";
import chatState from "../state/chatState.js";
// import hudState from "../state/hudState.js";
import { sendChatMessage } from "../services/ws.js";

function submitChat(event) {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 300) { chatState.setState({ error: "Message must be 300 characters or fewer." }); return; }
    sendChatMessage(text);
    input.value = "";
    chatState.setState({ error: "" });
}

export default function Chat() {
    const { messages, error } = chatState.getState();
    // const { message } = hudState.getState();

    return createElement(
        "section",
        { class: "messages-container", "aria-label": "Game chat" },
        {},
        createElement(
            "header",
            { class: "chat-header" },
            {},
            createElement("h2", {}, {}, "Game Chat"),
            createElement("p", { id: "game-message" }, {}, "Move with Arrow keys or WASD. Drop a bomb with Space."),
        ),
        createElement("ul", { class: "chat-messages", id: "chat-messages", "aria-live": "polite" }, {}),
        error ? createElement("p", { class: "chat-error", "aria-live": "polite" }, {}, error) : null,
        createElement(
            "form",
            { class: "chat-form" },
            { submit: submitChat },
            createElement("div", { class: "chat-send-row" }, {},
                createElement("input", { id: "chat-input", type: "text", maxlength: "300", placeholder: "Say something...", autocomplete: "off" }, {}),
                createElement("button", { type: "submit" }, {}, "Send"),
            ),
        ),
    );
}