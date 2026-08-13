import { createElement } from "mini-framework/src/vdom/index.js";

import { markItemAsCompleted, removeItem, changeItemContent, hideAllInputs, showAllItems } from "../src/helpers.js";

export default function ListItem(element, checkBoxState) {
  return createElement(
    "li",
    { "data-testid": "todo-item", "data-key": element.id, class: element.listType === "completed" ? "completed" : "" },
    {},
    createElement(
      "div",
      { class: "view" },
      {},
      createElement(
        "input",
        { class: "toggle", type: "checkbox", "data-testid": "todo-item-toggle", ...checkBoxState },
        {
          click: () => {
            markItemAsCompleted(element.id);
          },
        },
        "",
      ),
      createElement(
        "label",
        { "data-testid": "todo-item-label" },
        {
          dblclick: (event) => {
            // showAllItems + hideAllInputs both handles the case
            // where another editing input was open
            showAllItems();
            event.target.classList.add("hide-element");
            event.target.previousElementSibling.classList.add("hide-element"); // hide radio button
            event.target.nextElementSibling.classList.add("hide-element"); // hide delete button
            hideAllInputs();
            event.target.parentElement.lastElementChild.classList.remove("hide-input"); // show editing input
            event.target.parentElement.lastElementChild.focus(); // puts the keyboard cursor/focus inside the input.
          },
        },
        element.content,
      ),
      createElement(
        "button",
        { "data-testid": "todo-item-button", class: "destroy" },
        {
          click: () => {
            removeItem(element.id);
          },
        },
        "",
      ),
      createElement(
        "input",
        { class: "new-todo editing-input hide-input", "data-testid": "text-input", value: element.content }, // , id: "todo-input" is duplicate
        {
          keydown: (event) => {
            const value = event.target.value.trim();
            if (event.key === "Enter" && value.length >= 1) {
              changeItemContent(element.id, value);
              event.target.classList.add("hide-input");
              showAllItems();
            }
          },
        },
        "",
      ),
    ),
  )
}