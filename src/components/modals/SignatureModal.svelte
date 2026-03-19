<script>
  import { t } from '../../stores/i18n.js';

  let { onClose, onApply } = $props();
  let tr = $derived($t);

  let mode = $state('draw');
  let canvasEl;
  let isDrawing = $state(false);
  let ctx;
  let fileInput;

  $effect(() => {
    if (canvasEl && mode === 'draw') {
      ctx = canvasEl.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  });

  function startDraw(e) {
    if (!ctx) return;
    isDrawing = true;
    const rect = canvasEl.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e) {
    if (!isDrawing || !ctx) return;
    const rect = canvasEl.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDraw() {
    isDrawing = false;
  }

  function clearSignature() {
    if (ctx) {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
  }

  function applySignature() {
    if (mode === 'draw' && canvasEl) {
      const dataUrl = canvasEl.toDataURL('image/png');
      onApply(dataUrl);
      onClose();
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onApply(reader.result);
      onClose();
    };
    reader.readAsDataURL(file);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" style="width: 450px; padding: 24px;" onclick={(e) => e.stopPropagation()}>
    <h3 style="margin-bottom: 16px;">{tr('signatureTitle')}</h3>

    <div class="tabs">
      <button class="tab" class:active={mode === 'draw'} onclick={() => mode = 'draw'}>{tr('signatureDraw')}</button>
      <button class="tab" class:active={mode === 'upload'} onclick={() => mode = 'upload'}>{tr('signatureUpload')}</button>
    </div>

    {#if mode === 'draw'}
      <canvas
        bind:this={canvasEl}
        width="400"
        height="150"
        class="sig-canvas"
        onmousedown={startDraw}
        onmousemove={draw}
        onmouseup={stopDraw}
        onmouseleave={stopDraw}
      ></canvas>
      <button class="btn btn-ghost btn-sm" onclick={clearSignature} style="margin-top: 8px;">{tr('signatureClear')}</button>
    {:else}
      <input bind:this={fileInput} type="file" accept="image/*" onchange={handleFileUpload} style="display:none" />
      <button class="btn btn-ghost" onclick={() => fileInput.click()} style="width: 100%; margin-top: 12px;">
        {tr('signatureUpload')}
      </button>
    {/if}

    <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
      {#if mode === 'draw'}
        <button class="btn btn-primary" onclick={applySignature}>{tr('signatureApply')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
  }
  .tab {
    padding: 6px 16px;
    border-radius: 20px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--border-color);
  }
  .tab.active {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent);
  }
  .sig-canvas {
    width: 100%;
    height: 150px;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-sm);
    cursor: crosshair;
    background: white;
  }
</style>
