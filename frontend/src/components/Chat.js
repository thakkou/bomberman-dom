"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";
import chatState from "../state/chatState.js";
import { sendChatMessage } from "../services/ws.js";

function submitChat(event) {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 300) {
        chatState.setState({ error: "Message must be 300 characters or fewer." });
        return;
    }
    sendChatMessage(text);
    input.value = "";
    chatState.setState({ error: "" });
    input.focus();
}

const DEFAULT_HINT = "Move with Arrow keys or WASD. Drop a bomb with Space.";

// Shared by the waiting room and the game page. `options.hint` only changes the
// blurb under the title (the waiting room isn't a game yet).
export default function Chat(options = {}) {
    const { messages, error } = chatState.getState();
    const hint = options.hint ?? DEFAULT_HINT;
    // const { message } = hudState.getState();

    const chatRows = messages.length === 0
        ? [createElement("li", { class: "chat-empty" }, {}, "No messages yet.")]
        : messages.map(m =>
            createElement("li", { class: "chat-message" }, {},
                createElement("span", { class: "chat-author" }, {}, m.nickname),
                ": ",
                createElement("span", { class: "chat-text" }, {}, m.text),
            )
        );

    return createElement(
        "section",
        { class: "messages-container", id: "chat-component", "aria-label": "Game chat" },
        {},
        createElement(
            "header",
            { class: "chat-header" },
            {},
            createElement("h2", {}, {}, "Game Chat"),
            createElement("p", { id: "game-message" }, {}, hint),
        ),
        createElement(
            "ul",
            { class: "chat-messages", id: "chat-messages", "aria-live": "polite" },
            {},
            ...chatRows
        ),
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