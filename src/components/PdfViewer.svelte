<script>
  import { pdfStore } from '../stores/pdfStore.js';
  import { toolStore } from '../stores/toolStore.js';
  import { loadPdfDocument, renderPage, getPageTextContent } from '../lib/pdfRenderer.js';
  import {
    createFabricCanvas, setDrawingMode, addTextBox, addHighlight,
    addShape, addStickyNote, addStamp, deleteSelected,
    serializeCanvas, deserializeCanvas, clearCanvas
  } from '../lib/fabricManager.js';

  let store = $derived($pdfStore);
  let tools = $derived($toolStore);

  let containerEl = $state(null);
  let canvasEl = $state(null);
  let fabricCanvasEl = $state(null);
  let pdfDoc = $state(null);
  let fabricCanvas = $state(null);
  let currentRenderedPage = $state(0);
  let pageWidth = $state(0);
  let pageHeight = $state(0);
  let lastBytesId = $state(0);
  let renderToken = $state(0);

  $effect(() => {
    const bytes = store.pdfBytes;
    if (bytes) {
      const id = bytes.length + bytes[0] + bytes[bytes.length - 1];
      if (id !== lastBytesId) {
        lastBytesId = id;
        loadDocument(bytes);
      }
    }
  });

  async function loadDocument(bytes) {
    try {
      pdfDoc = await loadPdfDocument(bytes);
      currentRenderedPage = 0;
      renderToken++;
    } catch (err) {
      pdfStore.setError('Failed to load PDF: ' + err.message);
    }
  }

  $effect(() => {
    // Track dependencies explicitly
    const page = store.currentPage;
    const zoom = store.zoom;
    const pages = store.pages;
    const doc = pdfDoc;
    const canvas = canvasEl;
    const _token = renderToken;

    if (doc && canvas && page > 0) {
      doRender(doc, page, zoom, pages, canvas);
    }
  });

  async function doRender(doc, pageNum, zoom, pages, canvas) {
    // Save current fabric state before switching pages
    if (fabricCanvas && currentRenderedPage > 0 && currentRenderedPage !== pageNum) {
      try {
        const json = serializeCanvas(fabricCanvas);
        pdfStore.updatePageFabric(currentRenderedPage - 1, json);
      } catch { /* ignore serialization errors during page switch */ }
    }

    const pageInfo = pages[pageNum - 1];
    if (!pageInfo || pageInfo.deleted) return;

    const rotation = pageInfo.rotation || 0;
    const actualPageNum = pageInfo.isBlank ? -1 : pageInfo.pageNum;

    let w = 0, h = 0;

    if (actualPageNum > 0 && actualPageNum <= doc.numPages) {
      const dims = await renderPage(doc, actualPageNum, canvas, zoom * 1.5, rotation);
      w = dims.width;
      h = dims.height;
    } else if (pageInfo.isBlank) {
      w = (pageInfo.blankWidth || 595) * zoom * 1.5;
      h = (pageInfo.blankHeight || 842) * zoom * 1.5;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    pageWidth = w;
    pageHeight = h;
    currentRenderedPage = pageNum;

    // Setup fabric canvas overlay
    if (fabricCanvasEl && w > 0 && h > 0) {
      if (fabricCanvas) {
        try { fabricCanvas.dispose(); } catch { /* ok */ }
      }
      fabricCanvas = createFabricCanvas(fabricCanvasEl, w, h);

      // Restore saved fabric state
      if (pageInfo.fabricJson) {
        deserializeCanvas(fabricCanvas, pageInfo.fabricJson);
      }

      setupFabricTool();
    }
  }

  $effect(() => {
    if (fabricCanvas && tools.activeTool) {
      setupFabricTool();
    }
  });

  function setupFabricTool() {
    if (!fabricCanvas) return;

    // Reset drawing mode
    setDrawingMode(fabricCanvas, false);
    fabricCanvas.selection = true;

    switch (tools.activeTool) {
      case 'draw':
        setDrawingMode(fabricCanvas, true, tools.drawSettings);
        break;
      case 'select':
        fabricCanvas.selection = true;
        break;
      default:
        break;
    }
  }

  function handleCanvasClick(e) {
    if (!fabricCanvas) return;

    // Get pointer position relative to canvas
    const rect = fabricCanvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (tools.activeTool) {
      case 'text-add':
        addTextBox(fabricCanvas, {
          x, y,
          ...tools.textSettings,
        });
        break;

      case 'highlight':
        addHighlight(fabricCanvas, x, y, 150, 20, tools.highlightColor);
        break;

      case 'shapes':
        addShape(fabricCanvas, tools.shapeSettings.type, {
          x, y,
          ...tools.shapeSettings,
        });
        break;

      case 'note':
        addStickyNote(fabricCanvas, x, y);
        break;

      case 'stamp':
        addStamp(fabricCanvas, tools.stampType, x, y);
        break;

      case 'eraser':
        deleteSelected(fabricCanvas);
        break;
    }
  }

  function handleKeyDown(e) {
    if (!fabricCanvas) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const active = fabricCanvas.getActiveObject();
      if (active && !active.isEditing) {
        deleteSelected(fabricCanvas);
      }
    }
  }

  export function getFabricCanvas() {
    return fabricCanvas;
  }

  export function saveFabricState() {
    if (fabricCanvas && currentRenderedPage > 0) {
      try {
        const json = serializeCanvas(fabricCanvas);
        pdfStore.updatePageFabric(currentRenderedPage - 1, json);
      } catch { /* ignore */ }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="viewer-container" bind:this={containerEl}>
  {#if store.isLoading}
    <div class="viewer-loading">
      <div class="spinner"></div>
      <span>Loading PDF...</span>
    </div>
  {:else if store.error}
    <div class="viewer-error">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <p>{store.error}</p>
    </div>
  {:else if store.pdfBytes}
    <div class="page-wrapper" style="width: {pageWidth}px; height: {pageHeight}px;">
      <canvas bind:this={canvasEl} class="pdf-canvas"></canvas>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="fabric-wrapper" onclick={handleCanvasClick}>
        <canvas bind:this={fabricCanvasEl}></canvas>
      </div>
    </div>
  {/if}
</div>

<style>
  .viewer-container {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    background: var(--bg-primary);
  }

  .page-wrapper {
    position: relative;
    box-shadow: var(--shadow-lg);
    background: white;
  }

  .pdf-canvas {
    display: block;
  }

  .fabric-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .viewer-loading, .viewer-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    padding: 40px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
