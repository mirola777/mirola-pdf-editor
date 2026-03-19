<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { loadPdfLib, savePdf } from '../../lib/pdfEngine.js';
  import { downloadBytes, formatFileSize } from '../../lib/fileUtils.js';

  let { onClose } = $props();
  let tr = $derived($t);
  let store = $derived($pdfStore);
  let isProcessing = $state(false);
  let result = $state(null);

  async function compress() {
    isProcessing = true;
    const pdfBytes = store.pdfBytes;
    const fileSize = store.fileSize;
    try {
      const doc = await loadPdfLib(pdfBytes);
      const bytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      result = {
        originalSize: fileSize,
        newSize: bytes.length,
        bytes,
      };
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      isProcessing = false;
    }
  }

  function downloadResult() {
    if (result) {
      const name = store.fileName.replace('.pdf', '_compressed.pdf');
      downloadBytes(result.bytes, name);
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" style="width: 400px; padding: 24px;" onclick={(e) => e.stopPropagation()}>
    <h3 style="margin-bottom: 16px;">{tr('compressTitle')}</h3>

    {#if !result}
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Original: {formatFileSize(store.fileSize)}
      </p>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
        <button class="btn btn-primary" onclick={compress} disabled={isProcessing}>
          {isProcessing ? tr('processing') : tr('compressStart')}
        </button>
      </div>
    {:else}
      <div class="result">
        <div class="result-row">
          <span>Original:</span>
          <strong>{formatFileSize(result.originalSize)}</strong>
        </div>
        <div class="result-row">
          <span>Compressed:</span>
          <strong>{formatFileSize(result.newSize)}</strong>
        </div>
        <div class="result-row">
          <span>Saved:</span>
          <strong style="color: var(--success)">
            {Math.round((1 - result.newSize / result.originalSize) * 100)}%
          </strong>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick={onClose}>{tr('close')}</button>
        <button class="btn btn-primary" onclick={downloadResult}>{tr('download')}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .result {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }
  .result-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
</style>
