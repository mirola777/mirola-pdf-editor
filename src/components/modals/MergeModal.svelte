<script>
  import { t } from '../../stores/i18n.js';
  import { mergePdfs } from '../../lib/pdfEngine.js';
  import { readFileAsArrayBuffer } from '../../lib/fileUtils.js';
  import { downloadBytes } from '../../lib/fileUtils.js';

  let { onClose, onMerged } = $props();
  let tr = $derived($t);
  let files = $state([]);
  let isProcessing = $state(false);
  let fileInput;

  function addFiles(e) {
    const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    files = [...files, ...newFiles];
    e.target.value = '';
  }

  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
  }

  function moveUp(index) {
    if (index <= 0) return;
    const arr = [...files];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    files = arr;
  }

  function moveDown(index) {
    if (index >= files.length - 1) return;
    const arr = [...files];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    files = arr;
  }

  async function merge() {
    if (files.length < 2) return;
    isProcessing = true;
    try {
      const bytesList = await Promise.all(files.map(f => readFileAsArrayBuffer(f)));
      const merged = await mergePdfs(bytesList);
      downloadBytes(merged, 'merged.pdf');
      if (onMerged) onMerged(merged);
      onClose();
    } catch (err) {
      alert('Error merging: ' + err.message);
    } finally {
      isProcessing = false;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" style="width: 500px; padding: 24px;" onclick={(e) => e.stopPropagation()}>
    <h3 style="margin-bottom: 4px;">{tr('mergeTitle')}</h3>
    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">{tr('mergeDesc')}</p>

    <input bind:this={fileInput} type="file" accept="application/pdf" multiple onchange={addFiles} style="display:none" />

    <div class="file-list">
      {#each files as file, i}
        <div class="file-item">
          <div class="file-arrows">
            <button class="btn-icon btn-sm" onclick={() => moveUp(i)} disabled={i === 0}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button class="btn-icon btn-sm" onclick={() => moveDown(i)} disabled={i === files.length - 1}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <span class="file-name">{file.name}</span>
          <button class="btn-icon btn-sm" onclick={() => removeFile(i)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      {/each}
    </div>

    <button class="btn btn-ghost" onclick={() => fileInput.click()} style="width: 100%; margin-top: 8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      {tr('mergeAdd')}
    </button>

    <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
      <button class="btn btn-primary" onclick={merge} disabled={files.length < 2 || isProcessing}>
        {isProcessing ? tr('processing') : tr('mergeStart')}
      </button>
    </div>
  </div>
</div>

<style>
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
  }
  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }
  .file-arrows {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .file-name {
    flex: 1;
    font-size: 13px;
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
