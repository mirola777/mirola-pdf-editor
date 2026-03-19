<script>
  import { t } from '../stores/i18n.js';
  import { pdfStore } from '../stores/pdfStore.js';
  import { toolStore } from '../stores/toolStore.js';
  import { historyStore } from '../stores/historyStore.js';

  let { onSave, onDownload } = $props();

  let tr = $derived($t);
  let store = $derived($pdfStore);
  let tools = $derived($toolStore);
  let history = $derived($historyStore);

  const toolButtons = [
    { id: 'select', icon: 'cursor', key: 'toolSelect' },
    { id: 'text-edit', icon: 'type', key: 'toolTextEdit' },
    { id: 'text-add', icon: 'text-plus', key: 'toolTextAdd' },
    { id: 'highlight', icon: 'highlight', key: 'toolHighlight' },
    { id: 'draw', icon: 'pen', key: 'toolDraw' },
    { id: 'shapes', icon: 'shapes', key: 'toolShapes' },
    { id: 'image', icon: 'image', key: 'toolImage' },
    { id: 'signature', icon: 'signature', key: 'toolSignature' },
    { id: 'stamp', icon: 'stamp', key: 'toolStamp' },
    { id: 'note', icon: 'note', key: 'toolNote' },
    { id: 'eraser', icon: 'eraser', key: 'toolEraser' },
  ];

  function getToolIcon(icon) {
    const icons = {
      cursor: '<path d="M4 4l7 18 3-7 7-3z"/>',
      type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
      'text-plus': '<path d="M4 7V4h16v3"/><path d="M12 4v12"/><path d="M17 14v6"/><path d="M14 17h6"/>',
      highlight: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      pen: '<path d="M12 19l7-7 3 3-7 7-3 0 0-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>',
      shapes: '<rect x="3" y="3" width="7" height="7"/><circle cx="17.5" cy="6.5" r="4.5"/><path d="M14 14l3 6 3-6z"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
      signature: '<path d="M2 17c1-1 3-4 5-4s3 3 5 3 3-2 5-2 3 1 5 1"/><path d="M2 21h20"/>',
      stamp: '<path d="M5 21h14"/><path d="M7 17h10"/><path d="M9 17V13a3 3 0 016 0v4"/><circle cx="12" cy="8" r="3"/>',
      note: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
      eraser: '<path d="M20 20H7L3 16l9-9 8 8-4 4"/><path d="M6.5 13.5l5 5"/>',
    };
    return icons[icon] || '';
  }
</script>

<div class="toolbar">
  <div class="toolbar-group">
    <button
      class="btn-icon"
      class:disabled={!history.canUndo}
      onclick={() => { const action = historyStore.undo(); }}
      title={tr('undo') + ' (Ctrl+Z)'}
      disabled={!history.canUndo}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 0118 0"/></svg>
    </button>
    <button
      class="btn-icon"
      class:disabled={!history.canRedo}
      onclick={() => { const action = historyStore.redo(); }}
      title={tr('redo') + ' (Ctrl+Y)'}
      disabled={!history.canRedo}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M21 13a9 9 0 00-18 0"/></svg>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <div class="toolbar-group tools-scroll">
    {#each toolButtons as tool}
      <button
        class="btn-icon"
        class:active={tools.activeTool === tool.id}
        onclick={() => toolStore.setTool(tool.id)}
        title={tr(tool.key)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {@html getToolIcon(tool.icon)}
        </svg>
      </button>
    {/each}
  </div>

  <div class="toolbar-divider"></div>

  <div class="toolbar-group">
    <button class="btn-icon" onclick={() => pdfStore.setZoom(store.zoom - 0.1)} title={tr('zoomOut')} disabled={!store.fileName}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <span class="zoom-label">{Math.round(store.zoom * 100)}%</span>
    <button class="btn-icon" onclick={() => pdfStore.setZoom(store.zoom + 0.1)} title={tr('zoomIn')} disabled={!store.fileName}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <button
      class="btn-icon"
      class:active={store.fitMode === 'width'}
      onclick={() => pdfStore.setFitMode('width')}
      title={tr('fitWidth')}
      disabled={!store.fileName}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 3H3v18h18V3z"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
    </button>
    <button
      class="btn-icon"
      class:active={store.fitMode === 'page'}
      onclick={() => pdfStore.setFitMode('page')}
      title={tr('fitPage')}
      disabled={!store.fileName}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <div class="toolbar-group">
    <span class="page-nav">
      <button class="btn-icon btn-sm" onclick={() => pdfStore.setCurrentPage(store.currentPage - 1)} disabled={store.currentPage <= 1}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="page-label">{store.currentPage} {tr('pageOf')} {store.totalPages || 0}</span>
      <button class="btn-icon btn-sm" onclick={() => pdfStore.setCurrentPage(store.currentPage + 1)} disabled={store.currentPage >= store.totalPages}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </span>
  </div>

  <div class="toolbar-spacer"></div>

  <div class="toolbar-group">
    <button class="btn btn-primary btn-sm" onclick={onDownload} disabled={!store.fileName}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      {tr('download')}
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 44px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    gap: 4px;
    overflow-x: auto;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .tools-scroll {
    overflow-x: auto;
    flex-shrink: 1;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color);
    margin: 0 6px;
    flex-shrink: 0;
  }

  .toolbar-spacer { flex: 1; }

  .zoom-label {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-secondary);
    min-width: 40px;
    text-align: center;
  }

  .page-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .page-label {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .btn-icon:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .toolbar { height: 40px; padding: 0 8px; }
    .toolbar-divider { margin: 0 3px; }
  }
</style>
