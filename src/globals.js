import Router from "mini-framework/src/router.js";
import createState from "mini-framework/src/stateManager.js";

export const router = Router();

export const listType = createState({
  listType: "all",
});

export const list = createState({
  list: [],
});

export const data = createState({
  count: 0, // countActiveTasks(),
});