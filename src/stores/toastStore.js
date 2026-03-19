import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, update } = writable([]);
  let id = 0;

  function add(type, message, duration = 3000) {
    const toast = { id: ++id, type, message };
    update(toasts => [...toasts, toast]);
    setTimeout(() => {
      update(toasts => toasts.filter(t => t.id !== toast.id));
    }, duration);
  }

  return {
    subscribe,
    success(message) { add('success', message); },
    error(message) { add('error', message, 5000); },
    info(message) { add('info', message); },
    dismiss(toastId) {
      update(toasts => toasts.filter(t => t.id !== toastId));
    },
  };
}

export const toastStore = createToastStore();
