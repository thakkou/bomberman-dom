import { ROOT_NODE, createElement, renderElement, patchDOM } from "mini-framework/src/vdom/index.js";

import { router, data, list, listType } from "./globals.js";
import { countActiveTasks, changeItemContent, hideAllInputs, showAllItems, getActiveInput, getHiddenElement } from "./helpers.js";

// Components
import App from "../components/App.js";
import Home from "../components/Home.js";
import Footer from "../components/Footer.js";
import NotFound from "../components/NotFound.js";

data.subscribe(() => {
  patchDOM(router);
});

list.subscribe(() => {
  // Keep `count` in sync automatically whenever `list` changes,
  // instead of relying on every mutation site to update it manually.
  data.setState({ count: countActiveTasks() });
  patchDOM(router);
});

listType.subscribe(() => {
  patchDOM(router);
});

// --- ROUTES ---------------------------------------

router.addRoute({
  path: "/",
  handler: () => {
    listType.setState({ listType: "all" });
  },
  component: () => {
    return App(...Home());
  },
});

router.addRoute({
  path: "/active",
  handler: () => {
    listType.setState({ listType: "active" });
  },
  component: () => {
    return App(...Home());
  },
});

router.addRoute({
  path: "/completed",
  handler: () => {
    listType.setState({ listType: "completed" });
  },
  component: () => {
    return App(...Home());
  },
});

router.addRoute({
  path: "*",
  handler: () => {
    renderElement(true, ROOT_NODE, ...Home()); // MAYBE CAN USE PATCH dom ! + NotFound() not used for now
  },
  component: () => {
    return App(...Home());
  },
});

// --- ROUTES: END -------------------------

document.addEventListener("click", (event) => {
  event.stopPropagation();
  if (event.target.closest(".editing-input")) {
    return;
  }
  const value = getActiveInput()?.value.trim() || '';
  if (value.length >= 1) {
    changeItemContent(getHiddenElement()?.getAttribute('data-key'), value);
    hideAllInputs();
    showAllItems();
  }
});

router.init();
renderElement(false, document.body, Footer());