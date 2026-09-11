"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function PowerupBadge(icon, value, label) {
    return createElement("span", { class: "powerup-badge" }, {},
        createElement("span", { class: "powerup-icon" }, {}, icon),
        createElement("span", { class: "powerup-value", title: label }, {}, String(value)),
    );
}