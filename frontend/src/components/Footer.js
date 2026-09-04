"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function Footer() {
  return createElement(
    "footer",
    { class: "info" },
    {},
    createElement("p", {}, {}, "Double-click to edit a todo"),
    createElement("p", {}, {}, "Created by the TodoMVC Team"),
    createElement("p", {}, {}, "Part of ", createElement("a", { href: "http://todomvc.com" }, {}, "TodoMVC")),
  );
}