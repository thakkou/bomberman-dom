import { createElement } from "mini-framework/src/vdom/index.js";

export default function NotFound() {
  // + 'Page Not Found' message
  return createElement("h1", {}, {}, "404");
}