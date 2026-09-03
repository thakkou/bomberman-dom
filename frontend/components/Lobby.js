import { createElement } from "mini-framework/src/vdom/index.js";

export default function Lobby() {
    return createElement(
        "section",
        { class: "lobby-container", "aria-label": "Enter nickname" },
        {},
        createElement("h1", { class: "lobby-title" }, {}, "BOMBERMAN"),
        createElement("p", { class: "lobby-subtitle" }, {}, "Enter your nickname to join the game."),
        createElement("p", { class: "lobby-error", id: "lobby-error", "aria-live": "polite" }, {}, ""),
        createElement(
            "form",
            { class: "nickname-form", id: "nickname-form" }, // action/method removed, id added
            {},
            createElement("label", { for: "nickname" }, {}, "Nickname"),
            createElement(
                "input",
                {
                    id: "nickname",
                    name: "nickname",
                    type: "text",
                    maxlength: "20",
                    minlength: "1",
                    placeholder: "Enter your nickname...",
                    autocomplete: "nickname",
                    required: "true",
                    autofocus: "true"
                },
                {}
            ),
            createElement("button", { type: "submit" }, {}, "Join Game"),
        ),
    );
}