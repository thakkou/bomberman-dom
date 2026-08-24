import Router from "mini-framework/src/router.js";

import App from "../components/App.js";
import Lobby from "../components/Lobby.js";
import Waiting from "../components/Waiting.js";
import Game from "../components/Game.js";
import Chat from "../components/Chat.js";
import NotFound from "../components/NotFound.js";

import { patchDOM } from "mini-framework/src/vdom/index.js";

// --- ROUTES ---------------------------------------

const router = Router();

router.addRoute({
  path: "/lobby",
  handler: () => {
    patchDOM(router);
    // listType.setState({ listType: "completed" });
  },
  component: () => {
    return App(Lobby());
  },
});

router.addRoute({
  path: "/waiting",
  handler: () => {
    patchDOM(router);
    // listType.setState({ listType: "active" });
  },
  component: () => {
    return App(Waiting());
  },
});

router.addRoute({
  path: "/",
  handler: () => {
    // console.log('hi');
    patchDOM(router);
    // listType.setState({ listType: "all" });
  },
  component: () => {
    return App(Game(), Chat());
  },
});

router.addRoute({
  path: "*",
  handler: () => {
    patchDOM(router);
    // renderElement(true, ROOT_NODE, ...Home()); // MAYBE CAN USE PATCH dom ! + NotFound() not used for now
  },
  component: () => {
    return App(NotFound());
  },
});

router.init();

// --- ROUTES: END -------------------------