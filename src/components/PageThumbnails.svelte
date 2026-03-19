<script>
  import { pdfStore } from '../stores/pdfStore.js';
  import { t } from '../stores/i18n.js';
  import { loadPdfDocument, renderThumbnail } from '../lib/pdfRenderer.js';

  let store = $derived($pdfStore);
  let tr = $derived($t);
  let thumbnails = $state([]);
  let dragIndex = $state(-1);
  let dropIndex = $state(-1);

  // Version counter to cancel stale thumbnail loads
  let thumbVersion = 0;

  $effect(() => {
    if (store.pdfBytes) {
      loadThumbnails(store.pdfBytes, store.pages);
    } else {
      thumbnails = [];
    }
  });

  async function loadThumbnails(bytes, pages) {
    const myVersion = ++thumbVersion;
    try {
      const pdfDoc = await loadPdfDocument(bytes);
      // Bail if superseded
      if (myVersion !== thumbVersion) return;

      const thumbs = [];
      for (let i = 0; i < pages.length; i++) {
        // Bail if superseded
        if (myVersion !== thumbVersion) return;

        const page = pages[i];
        if (page.isBlank) {
          thumbs.push({ pageNum: i + 1, dataUrl: null, isBlank: true, deleted: page.deleted });
        } else if (page.pageNum <= pdfDoc.numPages) {
          const canvas = document.createElement('canvas');
          try {
            await renderThumbnail(pdfDoc, page.pageNum, canvas, 120);
            thumbs.push({
              pageNum: i + 1,
              dataUrl: canvas.toDataURL(),
              isBlank: false,
              deleted: page.deleted,
            });
          } catch (err) {
            console.warn('Thumbnail render error for page', i + 1, err.message);
            thumbs.push({ pageNum: i + 1, dataUrl: null, isBlank: false, deleted: page.deleted });
          }
        }
      }
      // Final bail check
      if (myVersion !== thumbVersion) return;
      thumbnails = thumbs;
    } catch (err) {
      if (myVersion !== thumbVersion) return;
      console.error('Failed to load thumbnails:', err);
    }
  }

  function goToPage(idx) {
    pdfStore.setCurrentPage(idx + 1);
  }

  function handleDragStart(e, idx) {
    dragIndex = idx;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    dropIndex = idx;
  }

  function handleDrop(e, idx) {
    e.preventDefault();
    if (dragIndex >= 0 && dragIndex !== idx) {
      pdfStore.reorderPages(dragIndex, idx);
    }
    dragIndex = -1;
    dropIndex = -1;
  }

  function handleDragEnd() {
    dragIndex = -1;
    dropIndex = -1;
  }
</script>

<div class="thumbnails-panel">
  <div class="thumbnails-header">
    <span class="thumbnails-title">{tr('sectionPages')}</span>
    <span class="thumbnails-count">{store.pages.filter(p => !p.deleted).length}</span>
  </div>

  <div class="thumbnails-list">
    {#each thumbnails as thumb, i}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="thumbnail-item"
        class:active={store.currentPage === i + 1}
        class:deleted={thumb.deleted}
        class:drop-target={dropIndex === i}
        draggable="true"
        onclick={() => goToPage(i)}
        ondragstart={(e) => handleDragStart(e, i)}
        ondragover={(e) => handleDragOver(e, i)}
        ondrop={(e) => handleDrop(e, i)}
        ondragend={handleDragEnd}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && goToPage(i)}
      >
        <div class="thumbnail-canvas">
          {#if thumb.isBlank}
            <div class="blank-page">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
          {:else if thumb.dataUrl}
            <img src={thumb.dataUrl} alt="Page {thumb.pageNum}" />
          {/if}
          {#if thumb.deleted}
            <div class="deleted-overlay">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          {/if}
        </div>
        <span class="thumbnail-label">{i + 1}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .thumbnails-panel {
    width: 140px;
    min-width: 140px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .thumbnails-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .thumbnails-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
  }

  .thumbnails-count {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 8px;
    background: var(--accent-light);
    color: var(--accent);
    font-family: var(--font-mono);
  }

  .thumbnails-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .thumbnail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.15s ease;
  }

  .thumbnail-item:hover {
    background: var(--bg-hover);
  }

  .thumbnail-item.active {
    border-color: var(--accent);
    background: var(--accent-light);
  }

  .thumbnail-item.deleted {
    opacity: 0.4;
  }

  .thumbnail-item.drop-target {
    border-color: var(--success);
    background: rgba(22, 163, 74, 0.1);
  }

  .thumbnail-canvas {
    width: 100%;
    aspect-ratio: 0.707;
    background: white;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumbnail-canvas img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .blank-page {
    color: var(--text-muted);
  }

  .deleted-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumbnail-label {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .thumbnails-panel { display: none; }
  }
</style>
