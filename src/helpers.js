import { data, list } from "./globals.js";

export function generateUniqueId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addItem(newItemVal) {
  list.setState({
    list: [
      ...list.getState().list,
      {
        id: generateUniqueId(),
        listType: "active",
        content: newItemVal,
      },
    ],
  });
}

export function removeCompleted() {
  for (let i = 0; i < list.getState().list.length; i++) {
    const element = list.getState().list[i];
    if (element.listType === "completed") {
      removeItem(element.id);
      i--;
    }
  }
}

export function removeItem(itemId) {
  list.setState({ list: [...list.getState().list.filter((item) => item.id !== itemId)] });
}

export function countActiveTasks() {
  return list.getState().list.filter((item) => item.listType === "active").length;
}

export function markItemAsCompleted(itemId) {
  list.setState({
    list: [
      ...list.getState().list.map((item) => {
        if (item.id === itemId) {
          if (item.listType === "completed") {
            return {
              ...item,
              listType: "active",
            };
          } else {
            return {
              ...item,
              listType: "completed",
            };
          }
        }
        return item;
      }),
    ],
  });
}

export function markAllItemsAsCompleted() {
  if (data.getState().count != 0) {
    list.setState({
      list: [
        ...list.getState().list.map((item) => {
          return {
            ...item,
            listType: "completed",
          };
        }),
      ],
    });
  } else {
    list.setState({
      list: [
        ...list.getState().list.map((item) => {
          return {
            ...item,
            listType: "active",
          };
        }),
      ],
    });
  }
}

export function changeItemContent(itemId, newContent) {
  list.setState({
    list: [
      ...list.getState().list.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            content: newContent,
          };
        }
        return item;
      }),
    ],
  });
}

// ******************************************************************

export function showAllItems() {
  document.querySelectorAll(".hide-element").forEach((el) => {
    el.classList.remove("hide-element");
  });
}

export function hideAllInputs() {
  document.querySelectorAll(".editing-input").forEach((el) => {
    el.classList.add("hide-input");
  });
}


export function getActiveInput() {
  return [...document.querySelectorAll(".editing-input")]
    .filter(el => ![...el.classList].includes('hide-input'))[0];
}

export function getHiddenElement() {
  return [...document.querySelectorAll("li")]
    .filter(el => el.getAttribute('data-testid') === "todo-item" && [...el.firstChild.querySelector('label').classList].includes('hide-element'))[0];
}