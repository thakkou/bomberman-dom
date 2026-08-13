import { createElement } from "mini-framework/src/vdom/index.js";

import { markAllItemsAsCompleted, addItem } from "../src/helpers.js";
import { list } from "../src/globals.js";

// Components
import ItemList from "./ItemList.js";
import ActionsBar from "./ActionsBar.js";

export default function Home() {
  let toggleAll = (list.getState().list.length > 0) ?
    createElement(
      "div",
      { class: "toggle-all-container" },
      {},
      createElement(
        "input",
        { class: "toggle-all", type: "checkbox", id: "toggle-all", "data-testid": "toggle-all" },
        { click: markAllItemsAsCompleted },
        "",
      ),
      createElement("label", { class: "toggle-all-label", for: "toggle-all" }),
    ) : {};

  return [
    createElement(
      "header",
      { class: "header", "data-testid": "header" },
      {},
      createElement("h1", {}, {}, "todos"),
      createElement(
        "input",
        { class: "new-todo", "data-testid": "text-input", "aria-label": "New Todo Input", placeholder: "What needs to be done?", type: "text" },
        {
          keydown: (event) => {
            const value = event.target.value.trim();
            if (event.key === "Enter" && value.length >= 1) {
              event.target.value = "";
              addItem(value);
            }
          },
        },
        "",
      ),
    ),
    createElement(
      "main",
      { class: "main", "data-testid": "main" },
      {},
      toggleAll,
      createElement(
        "ul",
        { class: "todo-list", "data-testid": "todo-list" }, 
        {},
        ...ItemList()
      )
    ),
    ...ActionsBar(),
  ];
}