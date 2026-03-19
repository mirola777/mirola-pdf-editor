<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { loadPdfLib, setMetadata, savePdf } from '../../lib/pdfEngine.js';

  let { onClose } = $props();
  let tr = $derived($t);
  let store = $derived($pdfStore);

  let title = $state(store.metadata.title);
  let author = $state(store.metadata.author);
  let subject = $state(store.metadata.subject);
  let keywords = $state(store.metadata.keywords);
  let isProcessing = $state(false);

  async function save() {
    isProcessing = true;
    try {
      const doc = await loadPdfLib(store.pdfBytes);
      await setMetadata(doc, { title, author, subject, keywords });
      const bytes = await savePdf(doc);
      pdfStore.updatePdfBytes(bytes);
      pdfStore.updateMetadata({ title, author, subject, keywords });
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
    <h3 style="margin-bottom: 16px;">{tr('metadataTitle')}</h3>

    <div class="fields">
      <label class="field">
        <span class="label">Title</span>
        <input type="text" bind:value={title} />
      </label>
      <label class="field">
        <span class="label">{tr('metadataAuthor')}</span>
        <input type="text" bind:value={author} />
      </label>
      <label class="field">
        <span class="label">{tr('metadataSubject')}</span>
        <input type="text" bind:value={subject} />
      </label>
      <label class="field">
        <span class="label">{tr('metadataKeywords')}</span>
        <input type="text" bind:value={keywords} placeholder="keyword1, keyword2" />
      </label>
    </div>

    <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick={onClose}>{tr('cancel')}</button>
      <button class="btn btn-primary" onclick={save} disabled={isProcessing}>
        {isProcessing ? tr('processing') : tr('metadataSave')}
      </button>
    </div>
  </div>
</div>

<style>
  .fields { display: flex; flex-direction: column; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
</style>
