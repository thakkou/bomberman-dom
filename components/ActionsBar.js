import { createElement } from "mini-framework/src/vdom/index.js";

import { removeCompleted } from "../src/helpers.js";
import { router, data, list, listType } from "../src/globals.js";

export default function ActionsBar() {
  let all = { class: "selected" };
  let active = { class: "selected" };
  let completed = { class: "selected" };

  switch (listType.getState().listType) {
    case "all":
      active = {}; completed = {};
      break;
    case "active":
      all = {}; completed = {};
      break;
    case "completed":
      all = {}; active = {};
      break;
  }
  
  if (list.getState().list.length != 0) {
    return [
      createElement(
        "footer",
        { class: "footer", "data-testid": "footer" },
        {},
        createElement("span", { class: "todo-count" }, {}, `${data.getState().count} ${data.getState().count === 1 ? 'item' : 'items'} left!`),
        createElement(
          "ul",
          { class: "filters", "data-testid": "footer-navigation" },
          {},
          createElement(
            "li",
            {},
            {},
            createElement(
              "a",
              { ...all, href: "#/" },
              {},
              "All",
            ),
          ),
          createElement(
            "li",
            {},
            {},
            createElement(
              "a",
              { ...active, href: "#/active" },
              {},
              "Active",
            ),
          ),
          createElement(
            "li",
            {},
            {},
            createElement(
              "a",
              { ...completed, href: "#/completed" },
              {},
              "Completed",
            ),
          ),
        ),
        ...(list.getState().list.length - data.getState().count > 0 ? [
          createElement(
            "button",
            { class: "clear-completed" },
            {
              click: () => {
                removeCompleted();
              },
            },
            "Clear completed",
          )
        ] : [])
      ),
    ];
  } else {
    return [];
  }
}