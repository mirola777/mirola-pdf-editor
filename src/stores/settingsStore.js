import { writable } from 'svelte/store';

function createThemeStore() {
  const saved = typeof localStorage !== 'undefined'
    ? localStorage.getItem('pdf-editor-theme') || 'dark'
    : 'dark';

  const { subscribe, set } = writable(saved);

  return {
    subscribe,
    toggle() {
      let current;
      subscribe(v => current = v)();
      const next = current === 'light' ? 'dark' : 'light';
      set(next);
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pdf-editor-theme', next);
    },
    init() {
      let current;
      subscribe(v => current = v)();
      document.documentElement.setAttribute('data-theme', current);
    }
  };
}

export const theme = createThemeStore();
