"use strict";

import { createElement, renderElement } from "mini-framework/src/vdom/index.js";
import chatState from "../state/chatState.js";

export function onChatMessage(message) {
  chatState.setState({ messages: [...chatState.getState().messages, message] });
}
export function onChatHistory(messages) {
  chatState.setState({ messages });
}
export function onChatError(error) {
  chatState.setState({ error });
}

function renderChat() {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  const { messages, error } = chatState.getState();
  const rows = messages.length === 0
    ? createElement("li", { class: "chat-empty" }, {}, "No messages yet.")
    : messages.map(m =>
        createElement("li", { class: "chat-message" }, {},
            createElement("span", { class: "chat-author" }, {}, m.nickname),
            ": ",
            createElement("span", { class: "chat-text" }, {}, m.text),
        )
    );
  renderElement(true, container, ...rows);
}

chatState.subscribe(renderChat);