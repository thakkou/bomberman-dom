import { createElement } from "mini-framework/src/vdom/index.js";

export default function NotFound() {
  return [
    createElement("h1", {}, {}, "404"),
    // + 'Page Not Found' message
  ];
}