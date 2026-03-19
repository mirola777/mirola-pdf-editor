<script>
  import { tick } from 'svelte';
  import { pdfStore } from '../stores/pdfStore.js';
  import { toolStore } from '../stores/toolStore.js';
  import { loadPdfDocument, renderPage, getPageTextContent } from '../lib/pdfRenderer.js';
  import {
    createFabricCanvas, setDrawingMode, addTextBox, addHighlight,
    addShape, addStickyNote, addStamp, deleteSelected,
    serializeCanvas, deserializeCanvas, clearCanvas,
    createEditableText, findTextAtPosition, setPdfBackground
  } from '../lib/fabricManager.js';

  let store = $derived($pdfStore);
  let tools = $derived($toolStore);

  // DOM refs
  let containerEl = $state(null);
  let fabricCanvasEl = $state(null);

  // Template-bound state
  let pageWidth = $state(0);
  let pageHeight = $state(0);

  // Internal tracking (non-reactive)
  let pdfDoc = null;
  let fabricCanvas = null;
  let currentRenderedPage = 0;
  let loadedBytesId = 0;
  let renderVer = 0;
  let pageTextItems = [];
  // Off-screen canvas for PDF rendering (used as Fabric background)
  let pdfRenderCanvas = document.createElement('canvas');

  // Single unified effect
  $effect(() => {
    const bytes = store.pdfBytes;
    const page = store.currentPage;
    const zoom = store.zoom;
    const pages = store.pages;
    const el = fabricCanvasEl;

    if (bytes && el && page > 0) {
      handleRender(bytes, page, zoom, pages, el);
    }
  });

  async function handleRender(bytes, page, zoom, pages, el) {
    const ver = ++renderVer;

    // Load document if bytes changed
    const bytesId = bytes.length + bytes[0] + bytes[bytes.length - 1];
    if (bytesId !== loadedBytesId) {
      loadedBytesId = bytesId;
      try {
        pdfDoc = await loadPdfDocument(bytes);
      } catch (err) {
        pdfStore.setError('Failed to load PDF: ' + err.message);
        return;
      }
      if (ver !== renderVer) return;
      currentRenderedPage = 0;
    }

    if (!pdfDoc) return;

    // Save fabric state before switching pages
    if (fabricCanvas && currentRenderedPage > 0 && currentRenderedPage !== page) {
      try {
        const json = serializeCanvas(fabricCanvas);
        pdfStore.updatePageFabric(currentRenderedPage - 1, json);
      } catch { /* ignore */ }
    }

    const pageInfo = pages[page - 1];
    if (!pageInfo || pageInfo.deleted) return;

    const rotation = pageInfo.rotation || 0;
    const actualPageNum = pageInfo.isBlank ? -1 : pageInfo.pageNum;
    let w = 0, h = 0;

    try {
      if (actualPageNum > 0 && actualPageNum <= pdfDoc.numPages) {
        // Render PDF to off-screen canvas
        const dims = await renderPage(pdfDoc, actualPageNum, pdfRenderCanvas, zoom * 1.5, rotation);
        if (!dims || ver !== renderVer) return;
        w = dims.width;
        h = dims.height;
      } else if (pageInfo.isBlank) {
        w = (pageInfo.blankWidth || 595) * zoom * 1.5;
        h = (pageInfo.blankHeight || 842) * zoom * 1.5;
        pdfRenderCanvas.width = w;
        pdfRenderCanvas.height = h;
        const ctx = pdfRenderCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
    } catch (err) {
      console.warn('PDF render error:', err.message);
      return;
    }

    if (ver !== renderVer || w === 0) return;

    pageWidth = w;
    pageHeight = h;
    currentRenderedPage = page;

    await tick();
    if (ver !== renderVer) return;

    await setupFabricOverlay(w, h, pageInfo);
    if (ver !== renderVer) return;

    // Load text positions for click-to-edit
    pageTextItems = [];
    if (actualPageNum > 0 && pdfDoc) {
      try {
        const textItems = await getPageTextContent(pdfDoc, actualPageNum, zoom * 1.5, rotation);
        if (ver !== renderVer) return;
        if (pageInfo.fabricJson && fabricCanvas) {
          const existing = fabricCanvas.getObjects().filter(o => o.customType === 'pdf-text');
          pageTextItems = textItems.filter(item => {
            const top = item.y - item.fontSize * 0.82;
            return !existing.some(ft =>
              Math.abs(ft.left - item.x) < 5 && Math.abs(ft.top - top) < 5
            );
          });
        } else {
          pageTextItems = textItems;
        }
      } catch (err) {
        console.warn('Text layer error:', err.message);
      }
    }
  }

  async function setupFabricOverlay(w, h, pageInfo) {
    if (!fabricCanvasEl || w <= 0 || h <= 0) return;

    if (!fabricCanvas) {
      fabricCanvas = createFabricCanvas(fabricCanvasEl, w, h);
    } else {
      fabricCanvas.off('selection:created');
      fabricCanvas.off('selection:updated');
      fabricCanvas.off('selection:cleared');
      fabricCanvas.off('object:modified');
      fabricCanvas.backgroundImage = null;
      fabricCanvas.clear();
      fabricCanvas.setDimensions({ width: w, height: h });
    }

    // Selection events
    fabricCanvas.on('selection:created', handleFabricSelection);
    fabricCanvas.on('selection:updated', handleFabricSelection);
    fabricCanvas.on('selection:cleared', () => toolStore.clearSelectedText());
    fabricCanvas.on('object:modified', handleFabricSelection);

    // Restore saved annotations
    if (pageInfo.fabricJson) {
      await deserializeCanvas(fabricCanvas, pageInfo.fabricJson);
    }

    // Set the PDF render as background image AFTER deserialize
    // (deserialize clears everything including background)
    setPdfBackground(fabricCanvas, pdfRenderCanvas);

    setupFabricTool();
  }

  function handleFabricSelection() {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
      toolStore.setSelectedText({
        fontSize: Math.round(obj.fontSize),
        fontFamily: obj.fontFamily,
        color: obj.fill || '#000000',
        bold: obj.fontWeight === 'bold',
        italic: obj.fontStyle === 'italic',
        underline: !!obj.underline,
      });
    } else {
      toolStore.clearSelectedText();
    }
  }

  $effect(() => {
    const tool = tools.activeTool;
    if (fabricCanvas && tool) {
      setupFabricTool();
    }
  });

  $effect(() => {
    const sel = tools.selectedText;
    if (!sel || !fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || (obj.type !== 'i-text' && obj.type !== 'textbox')) return;

    let changed = false;
    if (obj.fontSize !== sel.fontSize) { obj.set('fontSize', sel.fontSize); changed = true; }
    if (obj.fontFamily !== sel.fontFamily) { obj.set('fontFamily', sel.fontFamily); changed = true; }
    if (obj.fill !== sel.color) { obj.set('fill', sel.color); changed = true; }
    const newWeight = sel.bold ? 'bold' : 'normal';
    if (obj.fontWeight !== newWeight) { obj.set('fontWeight', newWeight); changed = true; }
    const newStyle = sel.italic ? 'italic' : 'normal';
    if (obj.fontStyle !== newStyle) { obj.set('fontStyle', newStyle); changed = true; }
    if (!!obj.underline !== sel.underline) { obj.set('underline', sel.underline); changed = true; }

    if (changed) fabricCanvas.renderAll();
  });

  function setupFabricTool() {
    if (!fabricCanvas) return;

    setDrawingMode(fabricCanvas, false);
    fabricCanvas.selection = true;

    switch (tools.activeTool) {
      case 'draw':
        setDrawingMode(fabricCanvas, true, tools.drawSettings);
        break;
      case 'select':
        fabricCanvas.selection = true;
        break;
    }
  }

  function handleCanvasClick(e) {
    if (!fabricCanvas) return;

    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) return;

    const rect = fabricCanvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (tools.activeTool) {
      case 'select':
      case 'text-edit': {
        const hit = findTextAtPosition(pageTextItems, x, y);
        if (hit) {
          createEditableText(fabricCanvas, hit);
          pageTextItems = pageTextItems.filter(t => t !== hit);
        }
        break;
      }
      case 'text-add':
        addTextBox(fabricCanvas, { x, y, ...tools.textSettings });
        break;
      case 'highlight':
        addHighlight(fabricCanvas, x, y, 150, 20, tools.highlightColor);
        break;
      case 'shapes':
        addShape(fabricCanvas, tools.shapeSettings.type, { x, y, ...tools.shapeSettings });
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

  .fabric-wrapper {
    width: 100%;
    height: 100%;
    pointer-events: auto;
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
