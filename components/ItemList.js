import { createElement } from "mini-framework/src/vdom/index.js";

import { list, listType } from "../src/globals.js";

import ListItem from "./ListItem.js";

export default function ItemList() {
  let result = [];
  for (let i = 0; i < list.getState().list.length; i++) {
    const element = list.getState().list[i];
    if (listType.getState().listType === "all" || listType.getState().listType === element.listType) {
      let checkBoxState = (element.listType === "completed") ?
        { checked: true } : {};
      result.push(ListItem(element, checkBoxState));
    }
  }
  return result;
}