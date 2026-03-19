import { writable, derived } from 'svelte/store';

const MAX_HISTORY = 50;

function createHistoryStore() {
  let undoStack = [];
  let redoStack = [];

  const { subscribe, set } = writable({ canUndo: false, canRedo: false, count: 0 });

  function notify() {
    set({ canUndo: undoStack.length > 0, canRedo: redoStack.length > 0, count: undoStack.length });
  }

  return {
    subscribe,

    push(action) {
      undoStack.push(action);
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
      notify();
    },

    undo() {
      if (undoStack.length === 0) return null;
      const action = undoStack.pop();
      redoStack.push(action);
      notify();
      return action;
    },

    redo() {
      if (redoStack.length === 0) return null;
      const action = redoStack.pop();
      undoStack.push(action);
      notify();
      return action;
    },

    clear() {
      undoStack = [];
      redoStack = [];
      notify();
    },
  };
}

export const historyStore = createHistoryStore();
