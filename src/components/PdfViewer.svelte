<script>
  import { tick } from 'svelte';
  import { pdfStore } from '../stores/pdfStore.js';
  import { toolStore } from '../stores/toolStore.js';
  import { toastStore } from '../stores/toastStore.js';
  import { loadPdfDocument, renderPage, getPageTextContent } from '../lib/pdfRenderer.js';
  import {
    createFabricCanvas, setDrawingMode, addTextBox, addPdfEditText, addHighlight,
    addShape, addStickyNote, addStamp, deleteSelected,
    serializeCanvas, deserializeCanvas, clearCanvas,
    findTextAtPosition, parsePdfFont
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
  let editStyle = $state({});
  let isApplying = $state(false);

  // Hover hint state
  let hoverHint = $state('');

  // Internal tracking (non-reactive)
  let pdfDoc = null;
  let fabricCanvas = null;
  let currentRenderedPage = 0;
  let loadedBytesId = 0;
  let renderVer = 0;
  let pageTextItems = [];

  // Render effect
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

  // Auto-focus and select editor text when it appears
  $effect(() => {
    if (editorRef && editingItem) {
      editorRef.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
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

    // Apply stored visual edits (bg cover rects only — text is on Fabric layer)
    const edits = store.pageEdits[page];
    if (edits && edits.length) {
      paintCoverRectsOnCanvas(canvas, edits, zoom * 1.5, h);
    }

    await tick();
    if (ver !== renderVer) return;

    setupFabricOverlay(w, h, pageInfo);

    // Load text positions for click-to-edit
    pageTextItems = [];
    if (actualPageNum > 0 && pdfDoc) {
      try {
        pageTextItems = await getPageTextContent(pdfDoc, actualPageNum, zoom * 1.5, rotation);
        if (ver !== renderVer) return;
        mergeEditsIntoTextItems(edits, zoom * 1.5, h);
      } catch (err) {
        console.warn('Text layer error:', err.message);
      }
    }
  }

  // Sample the background color near a text position
  function sampleBgColor(ctx, x, y, fontSize, textWidth) {
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const points = [
      [x + textWidth + 3, y - fontSize * 0.4],
      [x - 3, y - fontSize * 0.4],
      [x + 5, y - fontSize - 2],
      [x + 5, y + 3],
    ];

    let best = { r: 255, g: 255, b: 255 };
    let maxBrightness = 0;

    for (const [px, py] of points) {
      const sx = Math.max(0, Math.min(Math.round(px), cw - 1));
      const sy = Math.max(0, Math.min(Math.round(py), ch - 1));
      try {
        const pixel = ctx.getImageData(sx, sy, 1, 1).data;
        const brightness = pixel[0] + pixel[1] + pixel[2];
        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          best = { r: pixel[0], g: pixel[1], b: pixel[2] };
        }
      } catch { /* cross-origin or edge */ }
    }

    return best;
  }

  // Paint ONLY bg cover rects (text lives on Fabric layer as movable IText)
  function paintCoverRectsOnCanvas(canvas, edits, scale, canvasHeight) {
    if (!edits || !edits.length) return;
    const ctx = canvas.getContext('2d');
    const pdfPageH = canvasHeight / scale;

    for (const edit of edits) {
      const cx = edit.pdfX * scale;
      const cy = (pdfPageH - edit.pdfY) * scale;
      const cFontSize = edit.pdfFontSize * scale;

      const { fontFamily, fontWeight, fontStyle } = parsePdfFont(edit.fontName);
      ctx.font = `${fontWeight} ${fontStyle} ${cFontSize}px ${fontFamily}, Helvetica, Arial, sans-serif`;

      const origWidth = ctx.measureText(edit.originalText).width;
      const coverWidth = origWidth;

      // Sample background color to blend seamlessly
      const bg = sampleBgColor(ctx, cx, cy, cFontSize, coverWidth);
      ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
      ctx.fillRect(cx, cy - cFontSize * 0.82, coverWidth + 2, cFontSize);
    }
  }

  // Update pageTextItems to reflect stored edits
  function mergeEditsIntoTextItems(edits, scale, canvasHeight) {
    if (!edits || !edits.length) return;
    const pdfPageH = canvasHeight / scale;

    for (let i = 0; i < pageTextItems.length; i++) {
      const item = pageTextItems[i];
      const itemPdfX = item.x / scale;
      const itemPdfY = pdfPageH - item.y / scale;

      const edit = edits.find(e =>
        Math.abs(e.pdfX - itemPdfX) < 3 && Math.abs(e.pdfY - itemPdfY) < 3
      );

      if (edit) {
        pageTextItems[i] = {
          ...item,
          text: edit.newText,
          _originalText: edit.originalText,
          _edited: true,
        };
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
    fabricCanvas.on('object:modified', handleFabricModified);

    if (pageInfo.fabricJson) {
      deserializeCanvas(fabricCanvas, pageInfo.fabricJson);
      // Re-attach event listeners to pdf-edit objects after deserialization
      reattachEditListeners();
    }

    setupFabricTool();
  }

  // Re-attach move/edit listeners to deserialized pdf-edit objects
  function reattachEditListeners() {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    for (const obj of objects) {
      if (obj.customType === 'pdf-edit' && obj.editId) {
        attachEditObjectListeners(obj, obj.editId);
      }
    }
  }

  // Attach listeners that sync Fabric object position back to pageEdits
  function attachEditObjectListeners(textObj, editId) {
    textObj.on('modified', () => {
      const scale = store.zoom * 1.5;
      const pdfPageH = pageHeight / scale;
      const newPdfX = textObj.left / scale;
      const newPdfY = pdfPageH - (textObj.top + textObj.fontSize * 0.82) / scale;
      pdfStore.updatePageEditById(store.currentPage, editId, {
        pdfX: newPdfX,
        pdfY: newPdfY,
        newText: textObj.text,
      });
    });

    textObj.on('editing:exited', () => {
      pdfStore.updatePageEditById(store.currentPage, editId, {
        newText: textObj.text,
      });
    });
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

  function handleFabricModified() {
    handleFabricSelection();
    // Also handle pdf-edit objects
    const obj = fabricCanvas?.getActiveObject();
    if (obj?.customType === 'pdf-edit' && obj.editId) {
      const scale = store.zoom * 1.5;
      const pdfPageH = pageHeight / scale;
      pdfStore.updatePageEditById(store.currentPage, obj.editId, {
        pdfX: obj.left / scale,
        pdfY: pdfPageH - (obj.top + obj.fontSize * 0.82) / scale,
        newText: obj.text,
      });
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

  function openTextEditor(hit) {
    const { fontFamily, fontWeight, fontStyle } = parsePdfFont(hit.fontName);
    const textW = hit.width || hit.text.length * hit.fontSize * 0.55;

    // Sample bg color BEFORE painting over
    let bgColor = '#ffffff';
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      const bg = sampleBgColor(ctx, hit.x, hit.y, hit.fontSize, textW);
      bgColor = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
      hit._bgR = bg.r / 255;
      hit._bgG = bg.g / 255;
      hit._bgB = bg.b / 255;
    }

    editStyle = {
      left: hit.x - 1,
      top: hit.y - hit.fontSize * 0.9,
      fontSize: hit.fontSize,
      width: Math.min(textW + 20, pageWidth - hit.x - 4),
      maxWidth: pageWidth - hit.x - 4,
      fontFamily,
      fontWeight,
      fontStyle,
      bgColor,
    };

    // Paint bg-matched rect to hide original text
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(hit.x, hit.y - hit.fontSize * 0.82, textW + 2, hit.fontSize);
    }

    editingItem = hit;
  }

  // Cursor feedback: text cursor when hovering over editable text
  function handleCanvasMouseMove(e) {
    if (!fabricCanvasEl || editingItem || !fabricCanvas) return;
    const tool = tools.activeTool;
    if (tool !== 'select' && tool !== 'text-edit') {
      hoverHint = '';
      return;
    }

    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      hoverHint = '';
      return;
    }

    const rect = fabricCanvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = findTextAtPosition(pageTextItems, x, y);
    if (hit) {
      fabricCanvasEl.style.cursor = 'text';
      hoverHint = hit._edited ? 'Click to re-edit' : 'Click to edit text';
    } else {
      fabricCanvasEl.style.cursor = '';
      hoverHint = '';
    }
  }

  function handleCanvasClick(e) {
    if (!fabricCanvas) return;
    if (editingItem || isApplying) return;

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
          openTextEditor(hit);
        }
        break;
      }
      case 'text-add':
        addTextBox(fabricCanvas, { x, y, ...tools.textSettings });
        toastStore.info('Text box added — double-click to edit');
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
      editorRef?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  function cancelEdit() {
    editingItem = null;
    editStyle = {};
    hoverHint = '';
    currentRenderedPage = 0;
    handleRender(store.pdfBytes, store.currentPage, store.zoom, store.pages, canvasEl);
  }

  async function applyTextEdit() {
    if (!editingItem || isApplying) return;

    const newText = editorRef?.innerText?.trim() || '';
    const currentText = editingItem.text;

    if (newText === currentText) {
      cancelEdit();
      return;
    }

    isApplying = true;

    const scale = store.zoom * 1.5;
    const pdfPageH = pageHeight / scale;
    const pdfX = editingItem.x / scale;
    const pdfY = pdfPageH - editingItem.y / scale;
    const pdfFontSize = editingItem.fontSize / scale;
    const originalText = editingItem._originalText || currentText;
    const editId = Date.now() + Math.random();

    // Store the cover rect + text edit
    pdfStore.addPageEdit(store.currentPage, {
      editId,
      pdfX,
      pdfY,
      pdfFontSize,
      fontName: editingItem.fontName,
      originalText,
      newText,
      bgR: editingItem._bgR ?? 1,
      bgG: editingItem._bgG ?? 1,
      bgB: editingItem._bgB ?? 1,
    });

    // Create a movable Fabric IText instead of painting text on canvas
    if (fabricCanvas) {
      const { fontFamily, fontWeight, fontStyle } = parsePdfFont(editingItem.fontName);

      // Remove any existing pdf-edit object at this position
      const existing = fabricCanvas.getObjects().find(obj =>
        obj.customType === 'pdf-edit' &&
        Math.abs(obj.left - editingItem.x) < 5 &&
        Math.abs(obj.top - (editingItem.y - editingItem.fontSize * 0.82)) < 5
      );
      if (existing) {
        fabricCanvas.remove(existing);
      }

      const textObj = addPdfEditText(fabricCanvas, {
        text: newText,
        x: editingItem.x,
        y: editingItem.y - editingItem.fontSize * 0.82,
        fontSize: editingItem.fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        color: '#000000',
      });

      textObj.editId = editId;
      attachEditObjectListeners(textObj, editId);
      fabricCanvas.setActiveObject(textObj);
      fabricCanvas.renderAll();
    }

    // Update text item in memory for re-clicking
    const idx = pageTextItems.findIndex(item =>
      Math.abs(item.x - editingItem.x) < 2 && Math.abs(item.y - editingItem.y) < 2
    );
    if (idx >= 0) {
      pageTextItems[idx] = {
        ...pageTextItems[idx],
        text: newText,
        _originalText: originalText,
        _edited: true,
      };
    }

    editingItem = null;
    editStyle = {};
    isApplying = false;
    hoverHint = '';

    toastStore.success('Text updated — drag to reposition');
  }

  function handleKeyDown(e) {
    if (editingItem) return;
    if (!fabricCanvas) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const active = fabricCanvas.getActiveObject();
      if (active && !active.isEditing) {
        // If it's a pdf-edit object, also remove the pageEdit
        if (active.customType === 'pdf-edit' && active.editId) {
          pdfStore.removePageEditById(store.currentPage, active.editId);
          // Re-render to restore original text (remove cover rect)
          currentRenderedPage = 0;
          setTimeout(() => {
            handleRender(store.pdfBytes, store.currentPage, store.zoom, store.pages, canvasEl);
          }, 50);
        }
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
      <div
        class="fabric-wrapper"
        onclick={handleCanvasClick}
        onmousemove={handleCanvasMouseMove}
        onmouseleave={() => { hoverHint = ''; }}
      >
        <canvas bind:this={fabricCanvasEl}></canvas>
      </div>

      {#if editingItem}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          bind:this={editorRef}
          class="live-editor"
          contenteditable="true"
          role="textbox"
          tabindex="0"
          style="
            left: {editStyle.left}px;
            top: {editStyle.top}px;
            font-size: {editStyle.fontSize}px;
            min-width: {editStyle.width}px;
            max-width: {editStyle.maxWidth}px;
            font-family: {editStyle.fontFamily}, Helvetica, Arial, sans-serif;
            font-weight: {editStyle.fontWeight};
            font-style: {editStyle.fontStyle};
            background: {editStyle.bgColor || '#ffffff'};
          "
          onkeydown={handleEditKeydown}
          onblur={applyTextEdit}
        >{editingItem.text}</div>
      {/if}

      {#if hoverHint}
        <div class="hover-hint">{hoverHint}</div>
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

  /* Live inline text editor */
  .live-editor {
    position: absolute;
    z-index: 100;
    color: #000;
    outline: none;
    border: none;
    padding: 0 1px;
    margin: 0;
    line-height: 1.15;
    white-space: pre;
    cursor: text;
    box-shadow: 0 0 0 1.5px #3b82f6;
    border-radius: 1px;
    box-sizing: content-box;
  }

  .live-editor:focus {
    box-shadow: 0 0 0 2px #3b82f6, 0 0 8px rgba(59, 130, 246, 0.3);
  }

  /* Hover hint pill */
  .hover-hint {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(59, 130, 246, 0.9);
    color: white;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 20px;
    pointer-events: none;
    animation: hintFade 0.15s ease;
    white-space: nowrap;
    backdrop-filter: blur(4px);
  }

  @keyframes hintFade {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
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
