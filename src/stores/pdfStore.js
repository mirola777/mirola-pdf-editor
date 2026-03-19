import { writable, derived } from 'svelte/store';

const DEFAULTS = {
  file: null,
  fileName: '',
  fileSize: 0,
  pdfBytes: null,
  totalPages: 0,
  currentPage: 1,
  zoom: 1.0,
  fitMode: 'width',
  pages: [],
  pageEdits: {},  // { [pageNum]: [edit, ...] } — text edits stored until download
  metadata: { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' },
  isModified: false,
  isLoading: false,
  error: null,
};

function createPdfStore() {
  const { subscribe, set, update } = writable({ ...DEFAULTS });

  return {
    subscribe,
    set,
    update,

    loadFile(file, pdfBytes, totalPages, metadata) {
      set({
        ...DEFAULTS,
        file,
        fileName: file.name,
        fileSize: file.size,
        pdfBytes,
        totalPages,
        pages: Array.from({ length: totalPages }, (_, i) => ({
          pageNum: i + 1,
          rotation: 0,
          deleted: false,
          annotations: [],
          fabricJson: null,
        })),
        metadata: metadata || DEFAULTS.metadata,
      });
    },

    setLoading(loading) {
      update(s => ({ ...s, isLoading: loading }));
    },

    setError(error) {
      update(s => ({ ...s, error, isLoading: false }));
    },

    setCurrentPage(page) {
      update(s => ({ ...s, currentPage: Math.max(1, Math.min(page, s.totalPages)) }));
    },

    setZoom(zoom) {
      update(s => ({ ...s, zoom: Math.max(0.25, Math.min(5, zoom)), fitMode: 'custom' }));
    },

    setFitMode(mode) {
      update(s => ({ ...s, fitMode: mode }));
    },

    rotatePage(pageIndex, degrees) {
      update(s => {
        const pages = [...s.pages];
        pages[pageIndex] = { ...pages[pageIndex], rotation: (pages[pageIndex].rotation + degrees) % 360 };
        return { ...s, pages, isModified: true };
      });
    },

    rotateAll(degrees) {
      update(s => ({
        ...s,
        pages: s.pages.map(p => ({ ...p, rotation: (p.rotation + degrees) % 360 })),
        isModified: true,
      }));
    },

    deletePage(pageIndex) {
      update(s => {
        const pages = [...s.pages];
        pages[pageIndex] = { ...pages[pageIndex], deleted: true };
        const activeCount = pages.filter(p => !p.deleted).length;
        if (activeCount === 0) return s;
        return { ...s, pages, isModified: true };
      });
    },

    restorePage(pageIndex) {
      update(s => {
        const pages = [...s.pages];
        pages[pageIndex] = { ...pages[pageIndex], deleted: false };
        return { ...s, pages, isModified: true };
      });
    },

    reorderPages(fromIndex, toIndex) {
      update(s => {
        const pages = [...s.pages];
        const [moved] = pages.splice(fromIndex, 1);
        pages.splice(toIndex, 0, moved);
        return { ...s, pages, isModified: true };
      });
    },

    insertBlankPage(afterIndex, width = 595, height = 842) {
      update(s => {
        const pages = [...s.pages];
        pages.splice(afterIndex + 1, 0, {
          pageNum: -1,
          rotation: 0,
          deleted: false,
          annotations: [],
          fabricJson: null,
          isBlank: true,
          blankWidth: width,
          blankHeight: height,
        });
        return { ...s, pages, totalPages: s.totalPages + 1, isModified: true };
      });
    },

    updatePageFabric(pageIndex, fabricJson) {
      update(s => {
        const pages = [...s.pages];
        pages[pageIndex] = { ...pages[pageIndex], fabricJson };
        return { ...s, pages, isModified: true };
      });
    },

    updateMetadata(metadata) {
      update(s => ({ ...s, metadata: { ...s.metadata, ...metadata }, isModified: true }));
    },

    updatePdfBytes(pdfBytes) {
      update(s => ({ ...s, pdfBytes }));
    },

    addPageEdit(pageNum, edit) {
      update(s => {
        const pageEdits = { ...s.pageEdits };
        const edits = [...(pageEdits[pageNum] || [])];
        // Update existing edit at same position, or add new
        const existingIdx = edits.findIndex(e =>
          Math.abs(e.pdfX - edit.pdfX) < 3 && Math.abs(e.pdfY - edit.pdfY) < 3
        );
        if (existingIdx >= 0) {
          // Preserve the very first originalText
          edits[existingIdx] = { ...edit, originalText: edits[existingIdx].originalText };
        } else {
          edits.push(edit);
        }
        pageEdits[pageNum] = edits;
        return { ...s, pageEdits, isModified: true };
      });
    },

    clearAllEdits() {
      update(s => ({ ...s, pageEdits: {} }));
    },

    setModified(modified) {
      update(s => ({ ...s, isModified: modified }));
    },

    clear() {
      set({ ...DEFAULTS });
    },
  };
}

export const pdfStore = createPdfStore();

export const activePages = derived(pdfStore, $s =>
  $s.pages.map((p, i) => ({ ...p, originalIndex: i })).filter(p => !p.deleted)
);
