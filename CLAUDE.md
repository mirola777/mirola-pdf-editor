# Mirola's PDF Editor

## Overview
Free online PDF editor built with Svelte 5 + Vite 7. 100% client-side, no server uploads.

## Commands
- `npm run dev` - Start dev server (http://localhost:5173)
- `npm run build` - Production build to /dist
- `npm run preview` - Preview production build

## Tech Stack
- **Svelte 5** with runes ($state, $derived, $effect, $props, $bindable)
- **Vite 7** with @sveltejs/vite-plugin-svelte
- **pdf-lib** - PDF manipulation (merge, split, rotate, forms, metadata)
- **pdfjs-dist** - PDF rendering to canvas
- **Fabric.js 6** - Canvas overlay for annotations, drawing, text editing
- **Tesseract.js 5** - OCR text extraction
- **jsPDF** - PDF generation

## Architecture
- `src/components/` - Svelte components (PascalCase)
  - `modals/` - Modal dialogs (Merge, Split, Watermark, etc.)
  - `tools/` - Tool-specific components (FindReplace, StampSelector)
- `src/stores/` - Svelte writable stores (camelCase)
  - `pdfStore.js` - Core document state
  - `toolStore.js` - Active tool and settings
  - `historyStore.js` - Undo/redo command stack
  - `settingsStore.js` - Theme persistence
  - `i18n.js` - 4 languages (en/es/pt/fr)
- `src/lib/` - Business logic
  - `pdfEngine.js` - pdf-lib facade
  - `pdfRenderer.js` - PDF.js rendering
  - `fabricManager.js` - Fabric.js canvas management
  - `fileUtils.js` - Download/upload helpers
- `src/workers/` - Web Workers for heavy operations

## Key Patterns
- Stores use writable + derived, same pattern as grid-maker
- CSS variables for theming (blue accent #3b82f6), dark/light mode
- Components use $derived($store) for reactive state
- Fabric.js canvas overlays PDF.js rendered pages
- All PDF operations happen client-side via pdf-lib
- Heavy ops (OCR) use Web Workers

## Constraints
- No server-side storage - everything in browser
- Fabric.js v6 (canvas-based, not SVG)
- PDF.js worker must be configured via GlobalWorkerOptions
- Don't use Cropper.js (that's grid-maker)
