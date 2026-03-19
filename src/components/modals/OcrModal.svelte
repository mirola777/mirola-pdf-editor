<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { loadPdfDocument, renderPage } from '../../lib/pdfRenderer.js';
  import { downloadText } from '../../lib/fileUtils.js';

  let { onClose } = $props();
  let tr = $derived($t);
  let store = $derived($pdfStore);

  let language = $state('eng');
  let isProcessing = $state(false);
  let progress = $state(0);
  let extractedText = $state('');

  const languages = [
    { code: 'eng', label: 'English' },
    { code: 'spa', label: 'Spanish' },
    { code: 'por', label: 'Portuguese' },
    { code: 'fra', label: 'French' },
    { code: 'deu', label: 'German' },
    { code: 'ita', label: 'Italian' },
    { code: 'jpn', label: 'Japanese' },
    { code: 'chi_sim', label: 'Chinese (Simplified)' },
    { code: 'kor', label: 'Korean' },
    { code: 'ara', label: 'Arabic' },
  ];

  async function extract() {
    isProcessing = true;
    extractedText = '';
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(language);

      const pdfDoc = await loadPdfDocument(store.pdfBytes);
      const totalPages = pdfDoc.numPages;
      let allText = '';

      for (let i = 1; i <= totalPages; i++) {
        progress = Math.round((i / totalPages) * 100);

        const canvas = document.createElement('canvas');
        await renderPage(pdfDoc, i, canvas, 2);

        const { data } = await worker.recognize(canvas);
        allText += `--- Page ${i} ---\n${data.text}\n\n`;
      }

      await worker.terminate();
      extractedText = allText;
    } catch (err) {
      alert('OCR Error: ' + err.message);
    } finally {
      isProcessing = false;
    }
  }

  function copyText() {
    navigator.clipboard.writeText(extractedText);
  }

  function download() {
    const name = store.fileName.replace('.pdf', '_ocr.txt');
    downloadText(extractedText, name);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" style="width: 550px; padding: 24px;" onclick={(e) => e.stopPropagation()}>
    <h3 style="margin-bottom: 16px;">{tr('ocrTitle')}</h3>

    {#if !extractedText}
      <label class="field">
        <span class="label">{tr('ocrLanguage')}</span>
        <select bind:value={language}>
          {#each languages as lang}
            <option value={lang.code}>{lang.label}</option>
          {/each}
        </select>
      </label>

      {#if isProcessing}
        <div class="progress-bar" style="margin-top: 16px;">
          <div class="progress-fill" style="width: {progress}%"></div>
        </div>
        <p style="text-align: center; font-size: 13px; color: var(--text-muted); margin-top: 8px;">
          {tr('ocrProgress')} {progress}%
        </p>
      {/if}

      <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
        <button class="btn btn-primary" onclick={extract} disabled={isProcessing}>
          {isProcessing ? tr('processing') : tr('ocrStart')}
        </button>
      </div>
    {:else}
      <textarea class="ocr-result" readonly>{extractedText}</textarea>
      <div style="display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick={onClose}>{tr('close')}</button>
        <button class="btn btn-ghost" onclick={copyText}>{tr('copyToClipboard')}</button>
        <button class="btn btn-primary" onclick={download}>{tr('downloadTxt')}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .field { display: flex; flex-direction: column; gap: 4px; }
  .label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .progress-bar {
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .ocr-result {
    width: 100%;
    height: 300px;
    resize: vertical;
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    outline: none;
  }
</style>
