// import { ROOT_NODE, renderElement, patchDOM } from "mini-framework/src/vdom/index.js";

// import { router, data } from "./globals.js";

// // Components
// import App from "../components/App.js";
// import Footer from "../components/Footer.js";
// import NotFound from "../components/NotFound.js";

// ****************************************************************

"use strict";

import { buildLevel, draw, level } from "./functions.js";

// ---------- Main loop ----------
function loop(timestamp) {
  draw();
  requestAnimationFrame(loop);
}

buildLevel(level);
requestAnimationFrame(loop);

// ****************************************************************

// data.subscribe(() => {
//   patchDOM(router);
// });

// --- ROUTES ---------------------------------------

// router.addRoute({
//   path: "/",
//   handler: () => {
//     //
//   },
//   component: () => {
//     return App(...Home());
//   },
// });

// router.addRoute({
//   path: "*",
//   handler: () => {
//     renderElement(true, ROOT_NODE, ...NotFound()); // MAYBE CAN USE PATCH dom ! + NotFound() not used for now
//   },
//   component: () => {
//     return App(...NotFound());
//   },
// });

// --- ROUTES: END -------------------------

// router.init();
// renderElement(false, document.body, Footer());
