<script>
  import { t } from '../stores/i18n.js';

  let { onFileSelect } = $props();
  let tr = $derived($t);
  let isDragging = $state(false);
  let fileInput;

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type === 'application/pdf') {
        const file = item.getAsFile();
        if (file) onFileSelect(file);
        break;
      }
    }
  }
</script>

<svelte:window onpaste={handlePaste} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="dropzone"
  class:dragging={isDragging}
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  onclick={() => fileInput.click()}
>
  <input
    bind:this={fileInput}
    type="file"
    accept="application/pdf"
    onchange={handleFileInput}
    class="file-input"
  />

  <div class="drop-content">
    <div class="drop-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 12 15 15"/>
      </svg>
    </div>
    <h2 class="drop-title">{tr('dropTitle')}</h2>
    <p class="drop-sub">{tr('dropSub')}</p>
    <p class="drop-formats">{tr('dropFormats')}</p>
    <button class="btn btn-primary" onclick={(e) => { e.stopPropagation(); fileInput.click(); }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      {tr('browseFiles')}
    </button>
  </div>
</div>

<style>
  .dropzone {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-lg);
    margin: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--bg-primary);
  }

  .dropzone:hover, .dropzone.dragging {
    border-color: var(--accent);
    background: var(--accent-light);
  }

  .file-input {
    display: none;
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    text-align: center;
  }

  .drop-icon {
    color: var(--accent);
    opacity: 0.6;
    margin-bottom: 8px;
  }

  .drop-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .drop-sub {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .drop-formats {
    font-size: 12px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  @media (max-width: 768px) {
    .dropzone { margin: 10px; }
    .drop-content { padding: 20px; }
    .drop-title { font-size: 18px; }
    .drop-icon svg { width: 48px; height: 48px; }
  }
</style>
