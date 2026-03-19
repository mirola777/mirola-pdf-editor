<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { addWatermark } from '../../lib/pdfEngine.js';

  let { onClose } = $props();
  let tr = $derived($t);

  let text = $state('CONFIDENTIAL');
  let opacity = $state(0.15);
  let angle = $state(-45);
  let fontSize = $state(60);
  let color = $state('#888888');
  let isProcessing = $state(false);

  async function apply() {
    isProcessing = true;
    try {
      const currentStore = $pdfStore;
      const bytes = await addWatermark(currentStore.pdfBytes, text, { opacity, angle, fontSize, color });
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
    <h3 style="margin-bottom: 16px;">{tr('watermarkTitle')}</h3>

    <div class="fields">
      <label class="field">
        <span class="label">{tr('watermarkText')}</span>
        <input type="text" bind:value={text} />
      </label>
      <label class="field">
        <span class="label">{tr('watermarkOpacity')}: {opacity}</span>
        <input type="range" min="0.05" max="0.5" step="0.05" bind:value={opacity} />
      </label>
      <label class="field">
        <span class="label">{tr('watermarkAngle')}: {angle}deg</span>
        <input type="range" min="-90" max="90" step="5" bind:value={angle} />
      </label>
      <label class="field">
        <span class="label">{tr('watermarkSize')}: {fontSize}px</span>
        <input type="range" min="20" max="120" step="5" bind:value={fontSize} />
      </label>
      <label class="field">
        <span class="label">{tr('watermarkColor')}</span>
        <input type="color" bind:value={color} />
      </label>
    </div>

    <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
      <button class="btn btn-primary" onclick={apply} disabled={!text || isProcessing}>
        {isProcessing ? tr('processing') : tr('watermarkApply')}
      </button>
    </div>
  </div>
</div>

<style>
  .fields { display: flex; flex-direction: column; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
</style>
