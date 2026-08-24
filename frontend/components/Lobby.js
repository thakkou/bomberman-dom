// A lobby in a video game is a virtual waiting room or pre-match menu where players gather before a match starts.
import { createElement } from "mini-framework/src/vdom/index.js";

export default function Lobby() {
    return createElement(
        "section",
        { class: "lobby-container", "aria-label": "Enter nickname" },
        {},
        createElement("h1", { class: "lobby-title" }, {}, "BOMBERMAN"),
        createElement("p", { class: "lobby-subtitle" }, {}, "Enter your nickname to join the game."),
        createElement(
            "form",
            { class: "nickname-form", action: "/waiting", method: "GET" },
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
                    required: "true", // was without value
                    autofocus: "true" // was without value
                },
                {}
            ),
            createElement("button", { type: "submit" }, {}, "Join Game")
        ),
    );
}