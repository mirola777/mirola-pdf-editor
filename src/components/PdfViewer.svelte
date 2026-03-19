<script>
  import { tick } from 'svelte';
  import { pdfStore } from '../stores/pdfStore.js';
  import { toolStore } from '../stores/toolStore.js';
  import { loadPdfDocument, renderPage, getPageTextContent } from '../lib/pdfRenderer.js';
  import { editTextInPdf } from '../lib/pdfEngine.js';
  import {
    createFabricCanvas, setDrawingMode, addTextBox, addHighlight,
    addShape, addStickyNote, addStamp, deleteSelected,
    serializeCanvas, deserializeCanvas, clearCanvas,
    findTextAtPosition
  } from '../lib/fabricManager.js';

  let store = $derived($pdfStore);
  let tools = $derived($toolStore);

  // DOM refs
  let containerEl = $state(null);
  let canvasEl = $state(null);
  let fabricCanvasEl = $state(null);
  let editorRef = $state(null);

  // Template-bound state
  let pageWidth = $state(0);
  let pageHeight = $state(0);

  // Inline text editor state
  let editingItem = $state(null);
  let editValue = $state('');
  let isApplying = $state(false);

  // Internal tracking (non-reactive)
  let pdfDoc = null;
  let fabricCanvas = null;
  let currentRenderedPage = 0;
  let loadedBytesId = 0;
  let renderVer = 0;
  let pageTextItems = [];

  // Single unified effect
  $effect(() => {
    const bytes = store.pdfBytes;
    const page = store.currentPage;
    const zoom = store.zoom;
    const pages = store.pages;
    const canvas = canvasEl;

    if (bytes && canvas && page > 0) {
      handleRender(bytes, page, zoom, pages, canvas);
    }
  });

  // Auto-focus editor when it appears
  $effect(() => {
    if (editorRef && editingItem) {
      editorRef.focus();
      editorRef.select();
    }
  });

  async function handleRender(bytes, page, zoom, pages, canvas) {
    const ver = ++renderVer;

    const bytesId = bytes.length * 31 + bytes[0] * 17 + bytes[bytes.length - 1];
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
        const dims = await renderPage(pdfDoc, actualPageNum, canvas, zoom * 1.5, rotation);
        if (!dims || ver !== renderVer) return;
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

    setupFabricOverlay(w, h, pageInfo);

    // Load text positions for click-to-edit
    pageTextItems = [];
    if (actualPageNum > 0 && pdfDoc) {
      try {
        pageTextItems = await getPageTextContent(pdfDoc, actualPageNum, zoom * 1.5, rotation);
        if (ver !== renderVer) return;
      } catch (err) {
        console.warn('Text layer error:', err.message);
      }
    }
  }

  function setupFabricOverlay(w, h, pageInfo) {
    if (!fabricCanvasEl || w <= 0 || h <= 0) return;

    if (!fabricCanvas) {
      fabricCanvas = createFabricCanvas(fabricCanvasEl, w, h);
    } else {
      fabricCanvas.off('selection:created');
      fabricCanvas.off('selection:updated');
      fabricCanvas.off('selection:cleared');
      fabricCanvas.off('object:modified');
      fabricCanvas.clear();
      fabricCanvas.setDimensions({ width: w, height: h });
    }

    fabricCanvas.on('selection:created', handleFabricSelection);
    fabricCanvas.on('selection:updated', handleFabricSelection);
    fabricCanvas.on('selection:cleared', () => toolStore.clearSelectedText());
    fabricCanvas.on('object:modified', handleFabricSelection);

    if (pageInfo.fabricJson) {
      deserializeCanvas(fabricCanvas, pageInfo.fabricJson);
    }

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
    if (editingItem || isApplying) return;

    // Don't add objects when clicking on existing Fabric object
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) return;

    const rect = fabricCanvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (tools.activeTool) {
      case 'select':
      case 'text-edit': {
        // Click-to-edit: show inline HTML editor over the text
        const hit = findTextAtPosition(pageTextItems, x, y);
        if (hit) {
          // Paint white on the PDF canvas immediately to hide original text
          if (canvasEl) {
            const ctx = canvasEl.getContext('2d');
            ctx.fillStyle = '#ffffff';
            const top = hit.y - hit.fontSize;
            const w = hit.width || hit.text.length * hit.fontSize * 0.6;
            ctx.fillRect(hit.x - 1, top, w + 2, hit.fontSize * 1.3);
          }
          editingItem = hit;
          editValue = hit.text;
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

  function handleEditKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyTextEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editingItem = null;
      editValue = '';
      // Re-render page to restore the text we painted over
      loadedBytesId = 0;
      pdfStore.updatePdfBytes(store.pdfBytes);
    }
  }

  async function applyTextEdit() {
    if (!editingItem || isApplying) return;

    // If text didn't change, just close and restore painted area
    if (editValue === editingItem.text) {
      editingItem = null;
      editValue = '';
      // Re-render to restore the text we painted white over
      loadedBytesId = 0;
      pdfStore.updatePdfBytes(store.pdfBytes);
      return;
    }

    isApplying = true;

    try {
      const zoom = store.zoom;
      const scale = zoom * 1.5;
      const pageIndex = store.pages[store.currentPage - 1].pageNum - 1;

      // Modify the PDF directly using pdf-lib
      const newBytes = await editTextInPdf(store.pdfBytes, pageIndex, {
        x: editingItem.x,
        y: editingItem.y,
        fontSize: editingItem.fontSize,
        fontName: editingItem.fontName,
        originalText: editingItem.text,
        newText: editValue,
        scale,
      });

      // Force document reload on next render
      loadedBytesId = 0;

      // Update store → triggers re-render with the ACTUAL modified PDF
      pdfStore.updatePdfBytes(newBytes);
    } catch (err) {
      console.error('Text edit failed:', err);
      alert('Error editing text: ' + err.message);
    }

    editingItem = null;
    editValue = '';
    isApplying = false;
  }

  function handleKeyDown(e) {
    if (editingItem) return; // Don't interfere with editor
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

      {#if editingItem}
        {@const inputW = Math.min(
          Math.max(editingItem.width || editingItem.text.length * editingItem.fontSize * 0.55, editingItem.fontSize * 4),
          pageWidth - editingItem.x - 4
        )}
        <input
          bind:this={editorRef}
          type="text"
          class="inline-text-editor"
          style="
            left: {editingItem.x - 2}px;
            top: {editingItem.y - editingItem.fontSize}px;
            font-size: {Math.round(editingItem.fontSize * 0.85)}px;
            height: {editingItem.fontSize * 1.2}px;
            width: {inputW}px;
            max-width: {pageWidth - editingItem.x - 4}px;
          "
          bind:value={editValue}
          onkeydown={handleEditKeydown}
          onblur={applyTextEdit}
        />
      {/if}
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
    pointer-events: auto;
  }

  .inline-text-editor {
    position: absolute;
    border: 2px solid var(--accent, #3b82f6);
    background: rgba(255, 255, 255, 0.95);
    padding: 0 3px;
    outline: none;
    box-sizing: border-box;
    z-index: 100;
    font-family: Helvetica, Arial, sans-serif;
    color: #000;
    line-height: 1.2;
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
