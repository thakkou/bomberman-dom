"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function App(...elements) {
    return createElement(
        "section",
        { class: "bomberman-dom", id: "root" },
        {},
        ...elements
    );
}