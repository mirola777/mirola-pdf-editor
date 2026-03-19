import { writable } from 'svelte/store';

const DEFAULTS = {
  activeTool: 'select',
  textSettings: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    color: '#000000',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
  },
  drawSettings: {
    color: '#ff0000',
    width: 2,
    opacity: 1,
  },
  shapeSettings: {
    type: 'rectangle',
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 2,
  },
  highlightColor: '#ffff00',
  stampType: 'approved',
  sidebarOpen: true,
  thumbnailsOpen: true,
  sidebarSection: 'tools',
};

function createToolStore() {
  const { subscribe, set, update } = writable({ ...DEFAULTS });

  return {
    subscribe,
    set,
    update,

    setTool(tool) {
      update(s => ({ ...s, activeTool: tool }));
    },

    updateTextSettings(partial) {
      update(s => ({ ...s, textSettings: { ...s.textSettings, ...partial } }));
    },

    updateDrawSettings(partial) {
      update(s => ({ ...s, drawSettings: { ...s.drawSettings, ...partial } }));
    },

    updateShapeSettings(partial) {
      update(s => ({ ...s, shapeSettings: { ...s.shapeSettings, ...partial } }));
    },

    setHighlightColor(color) {
      update(s => ({ ...s, highlightColor: color }));
    },

    setStampType(type) {
      update(s => ({ ...s, stampType: type }));
    },

    toggleSidebar() {
      update(s => ({ ...s, sidebarOpen: !s.sidebarOpen }));
    },

    toggleThumbnails() {
      update(s => ({ ...s, thumbnailsOpen: !s.thumbnailsOpen }));
    },

    setSidebarSection(section) {
      update(s => ({ ...s, sidebarSection: section }));
    },

    reset() {
      set({ ...DEFAULTS });
    },
  };
}

export const toolStore = createToolStore();
