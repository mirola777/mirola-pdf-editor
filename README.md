# Mirola's PDF Editor

Free, powerful online PDF editor. Edit text, merge, split, annotate, sign, and more. **100% client-side** - your files never leave your browser.

## Demo

**[mirola-pdf-editor.vercel.app](https://mirola-pdf-editor.vercel.app)**

## Features

### Text Editing
- Edit existing text in PDFs
- Add new text boxes anywhere
- Find & Replace across all pages
- Font family, size, color customization
- Bold, italic, underline, text alignment

### Page Operations
- Merge multiple PDFs
- Split PDF by page ranges
- Reorder pages (drag & drop)
- Delete and restore pages
- Rotate pages (90/180/270)
- Extract specific pages
- Insert blank pages

### Annotations & Markup
- Highlight text (4 colors)
- Underline / Strikethrough
- Freehand drawing with pen tool
- Shapes: rectangles, circles, arrows, lines
- Sticky notes / comments
- Stamps: Approved, Draft, Confidential, Reviewed

### Images & Signatures
- Add images to PDF pages
- Electronic signature (draw or upload)
- Text/image watermarks with opacity control

### Forms
- Fill PDF form fields
- Flatten forms permanently

### Conversion & Export
- PDF to images (PNG/JPEG)
- Compress/optimize PDF
- OCR text extraction (100+ languages)
- PDF to text export

### Utilities
- Add page numbers (6 positions, 3 formats)
- Document metadata editor
- Keyboard shortcuts (Ctrl+Z/Y/S/F)
- Dark / Light mode
- 4-language UI (EN/ES/PT/FR)

## Privacy

Your files are **never uploaded** to any server. All processing happens directly in your browser using JavaScript. No accounts, no tracking, no data collection.

## Tech Stack

- [Svelte 5](https://svelte.dev/) - Reactive UI framework
- [Vite 7](https://vite.dev/) - Build tool
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Fabric.js](http://fabricjs.com/) - Canvas annotations
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR
- CSS Custom Properties - Theming

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/mirola777/mirola-pdf-editor.git
cd mirola-pdf-editor
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.svelte              # Main layout and orchestration
├── main.js                 # Entry point
├── components/
│   ├── Header.svelte       # App header with logo, status
│   ├── Footer.svelte       # Footer with branding, info
│   ├── Toolbar.svelte      # Tool buttons, zoom, navigation
│   ├── Sidebar.svelte      # Right panel with tool settings
│   ├── PdfViewer.svelte    # PDF rendering + Fabric.js overlay
│   ├── PageThumbnails.svelte # Left panel page previews
│   ├── DropZone.svelte     # File upload landing
│   ├── modals/             # Modal dialogs
│   └── tools/              # Tool-specific components
├── stores/                 # Svelte stores (state management)
├── lib/                    # Business logic and PDF operations
├── workers/                # Web Workers (OCR)
└── styles/                 # Global CSS with theme variables
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**[mirola777](https://github.com/mirola777)**
