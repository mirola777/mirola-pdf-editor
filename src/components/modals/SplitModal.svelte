<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { splitPdf, extractPages } from '../../lib/pdfEngine.js';
  import { downloadBytes } from '../../lib/fileUtils.js';

  let { onClose } = $props();
  let tr = $derived($t);
  let store = $derived($pdfStore);

  let mode = $state('ranges');
  let rangeText = $state('');
  let everyN = $state(1);
  let isProcessing = $state(false);

  function parseRanges(text, total) {
    const ranges = [];
    const parts = text.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        if (a > 0 && b > 0 && a <= total && b <= total) {
          const range = [];
          for (let i = Math.min(a, b); i <= Math.max(a, b); i++) range.push(i);
          ranges.push(range);
        }
      } else {
        const n = parseInt(part);
        if (n > 0 && n <= total) ranges.push([n]);
      }
    }
    return ranges;
  }

  async function split() {
    isProcessing = true;
    try {
      let ranges;
      if (mode === 'ranges') {
        ranges = parseRanges(rangeText, store.totalPages);
      } else if (mode === 'every') {
        ranges = [];
        for (let i = 0; i < store.totalPages; i += everyN) {
          const r = [];
          for (let j = i; j < Math.min(i + everyN, store.totalPages); j++) r.push(j + 1);
          ranges.push(r);
        }
      } else {
        ranges = Array.from({ length: store.totalPages }, (_, i) => [i + 1]);
      }

      if (ranges.length === 0) return;

      const results = await splitPdf(store.pdfBytes, ranges);
      for (const result of results) {
        downloadBytes(result.bytes, result.name);
      }
      onClose();
    } catch (err) {
      alert('Error splitting: ' + err.message);
    } finally {
      isProcessing = false;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" style="width: 450px; padding: 24px;" onclick={(e) => e.stopPropagation()}>
    <h3 style="margin-bottom: 4px;">{tr('splitTitle')}</h3>
    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">{tr('splitDesc')} ({store.totalPages} pages)</p>

    <div class="mode-selector">
      <button class="btn btn-ghost btn-sm" class:active={mode === 'ranges'} onclick={() => mode = 'ranges'}>{tr('splitByPages')}</button>
      <button class="btn btn-ghost btn-sm" class:active={mode === 'every'} onclick={() => mode = 'every'}>{tr('splitEvery')}</button>
      <button class="btn btn-ghost btn-sm" class:active={mode === 'individual'} onclick={() => mode = 'individual'}>{tr('splitIndividual')}</button>
    </div>

    {#if mode === 'ranges'}
      <input type="text" bind:value={rangeText} placeholder="e.g. 1-3, 4-6, 7" style="margin-top: 12px;" />
    {:else if mode === 'every'}
      <div style="margin-top: 12px;">
        <label style="font-size: 12px; color: var(--text-muted);">Every N pages:</label>
        <input type="number" bind:value={everyN} min="1" max={store.totalPages} />
      </div>
    {/if}

    <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
      <button class="btn btn-primary" onclick={split} disabled={isProcessing}>
        {isProcessing ? tr('processing') : tr('splitStart')}
      </button>
    </div>
  </div>
</div>

<style>
  .mode-selector {
    display: flex;
    gap: 4px;
  }
  .btn-ghost.active {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent);
  }
</style>
