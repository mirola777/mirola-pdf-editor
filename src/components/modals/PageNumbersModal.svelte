<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { addPageNumbers } from '../../lib/pdfEngine.js';

  let { onClose } = $props();
  let tr = $derived($t);

  let position = $state('bottom-center');
  let format = $state('number');
  let startNumber = $state(1);
  let fontSize = $state(12);
  let color = $state('#000000');
  let isProcessing = $state(false);

  const positions = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];

  async function apply() {
    isProcessing = true;
    try {
      const currentStore = $pdfStore;
      const bytes = await addPageNumbers(currentStore.pdfBytes, { position, format, startNumber, fontSize, color });
      pdfStore.updatePdfBytes(bytes);
      pdfStore.setModified(true);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      isProcessing = false;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" style="width: 420px; padding: 24px;" onclick={(e) => e.stopPropagation()}>
    <h3 style="margin-bottom: 16px;">{tr('pageNumbersTitle')}</h3>

    <div class="fields">
      <label class="field">
        <span class="label">{tr('pageNumbersPosition')}</span>
        <select bind:value={position}>
          {#each positions as pos}
            <option value={pos}>{tr('pos' + pos.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(''))}</option>
          {/each}
        </select>
      </label>
      <label class="field">
        <span class="label">{tr('pageNumbersFormat')}</span>
        <select bind:value={format}>
          <option value="number">1, 2, 3...</option>
          <option value="roman">I, II, III...</option>
          <option value="page-of">1 / N</option>
        </select>
      </label>
      <div style="display: flex; gap: 8px;">
        <label class="field" style="flex:1">
          <span class="label">{tr('pageNumbersStart')}</span>
          <input type="number" bind:value={startNumber} min="1" />
        </label>
        <label class="field">
          <span class="label">{tr('watermarkSize')}</span>
          <input type="number" bind:value={fontSize} min="8" max="36" />
        </label>
        <label class="field">
          <span class="label">{tr('watermarkColor')}</span>
          <input type="color" bind:value={color} />
        </label>
      </div>
    </div>

    <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
      <button class="btn btn-primary" onclick={apply} disabled={isProcessing}>
        {isProcessing ? tr('processing') : tr('pageNumbersApply')}
      </button>
    </div>
  </div>
</div>

<style>
  .fields { display: flex; flex-direction: column; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
</style>
