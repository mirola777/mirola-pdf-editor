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

  let containerEl;
  let canvasEl;
  let fabricCanvasEl;
  let pdfDoc = $state(null);
  let fabricCanvas = $state(null);
  let currentRenderedPage = $state(0);
  let pageWidth = $state(0);
  let pageHeight = $state(0);

  $effect(() => {
    if (store.pdfBytes && store.pdfBytes !== lastPdfBytes) {
      lastPdfBytes = store.pdfBytes;
      loadDocument(store.pdfBytes);
    }
  });

  let lastPdfBytes = null;

  async function loadDocument(bytes) {
    try {
      pdfDoc = await loadPdfDocument(bytes);
    } catch (err) {
      pdfStore.setError('Failed to load PDF: ' + err.message);
    }
  }

  $effect(() => {
    if (pdfDoc && store.currentPage > 0 && store.currentPage !== currentRenderedPage) {
      renderCurrentPage();
    }
  });

  $effect(() => {
    if (pdfDoc && store.zoom) {
      renderCurrentPage();
    }
  });

  async function renderCurrentPage() {
    if (!pdfDoc || !canvasEl) return;

    // Save current fabric state before switching pages
    if (fabricCanvas && currentRenderedPage > 0) {
      const json = serializeCanvas(fabricCanvas);
      pdfStore.updatePageFabric(currentRenderedPage - 1, json);
    }

    const pageNum = store.currentPage;
    const pageInfo = store.pages[pageNum - 1];
    if (!pageInfo || pageInfo.deleted) return;

    const rotation = pageInfo.rotation || 0;
    const actualPageNum = pageInfo.isBlank ? -1 : pageInfo.pageNum;

    if (actualPageNum > 0 && actualPageNum <= pdfDoc.numPages) {
      const dims = await renderPage(pdfDoc, actualPageNum, canvasEl, store.zoom * 1.5, rotation);
      pageWidth = dims.width;
      pageHeight = dims.height;
    } else if (pageInfo.isBlank) {
      const w = (pageInfo.blankWidth || 595) * store.zoom * 1.5;
      const h = (pageInfo.blankHeight || 842) * store.zoom * 1.5;
      canvasEl.width = w;
      canvasEl.height = h;
      const ctx = canvasEl.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      pageWidth = w;
      pageHeight = h;
    }

    currentRenderedPage = pageNum;

    // Setup fabric canvas overlay
    if (fabricCanvasEl) {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
      fabricCanvas = createFabricCanvas(fabricCanvasEl, pageWidth, pageHeight);

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

    const pointer = fabricCanvas.getViewportPoint(e);

    switch (tools.activeTool) {
      case 'text-add':
        addTextBox(fabricCanvas, {
          x: pointer.x,
          y: pointer.y,
          ...tools.textSettings,
        });
        break;

      case 'highlight':
        addHighlight(fabricCanvas, pointer.x, pointer.y, 150, 20, tools.highlightColor);
        break;

      case 'shapes':
        addShape(fabricCanvas, tools.shapeSettings.type, {
          x: pointer.x,
          y: pointer.y,
          ...tools.shapeSettings,
        });
        break;

      case 'note':
        addStickyNote(fabricCanvas, pointer.x, pointer.y);
        break;

      case 'stamp':
        addStamp(fabricCanvas, tools.stampType, pointer.x, pointer.y);
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
      const json = serializeCanvas(fabricCanvas);
      pdfStore.updatePageFabric(currentRenderedPage - 1, json);
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
