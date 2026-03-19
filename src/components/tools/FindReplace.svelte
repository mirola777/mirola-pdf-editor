<script>
  import { t } from '../../stores/i18n.js';
  import { pdfStore } from '../../stores/pdfStore.js';
  import { loadPdfDocument, extractAllText } from '../../lib/pdfRenderer.js';

  let { onClose } = $props();
  let tr = $derived($t);
  let store = $derived($pdfStore);

  let searchText = $state('');
  let replaceText = $state('');
  let matches = $state([]);
  let currentMatch = $state(0);

  async function find() {
    if (!searchText) { matches = []; return; }
    try {
      const pdfDoc = await loadPdfDocument(store.pdfBytes);
      const pages = await extractAllText(pdfDoc);
      const results = [];
      for (const page of pages) {
        let idx = 0;
        const lower = page.text.toLowerCase();
        const search = searchText.toLowerCase();
        while ((idx = lower.indexOf(search, idx)) !== -1) {
          results.push({ pageNum: page.pageNum, position: idx });
          idx += search.length;
        }
      }
      matches = results;
      currentMatch = 0;
      if (results.length > 0) {
        pdfStore.setCurrentPage(results[0].pageNum);
      }
    } catch (err) {
      console.error('Find error:', err);
    }
  }

  function nextMatch() {
    if (matches.length === 0) return;
    currentMatch = (currentMatch + 1) % matches.length;
    pdfStore.setCurrentPage(matches[currentMatch].pageNum);
  }

  function prevMatch() {
    if (matches.length === 0) return;
    currentMatch = (currentMatch - 1 + matches.length) % matches.length;
    pdfStore.setCurrentPage(matches[currentMatch].pageNum);
  }
</script>

<div class="find-panel">
  <div class="find-header">
    <span class="find-title">{tr('findReplace')}</span>
    <button class="btn-icon btn-sm" onclick={onClose}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <div class="find-body">
    <div class="find-row">
      <input
        type="text"
        bind:value={searchText}
        placeholder={tr('findPlaceholder')}
        onkeydown={(e) => e.key === 'Enter' && find()}
      />
      <button class="btn-icon btn-sm" onclick={find} title="Search">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
    </div>

    {#if matches.length > 0}
      <div class="match-info">
        <span>{currentMatch + 1} / {matches.length} {tr('matchesFound')}</span>
        <div class="match-nav">
          <button class="btn-icon btn-sm" onclick={prevMatch}>{tr('findPrev')}</button>
          <button class="btn-icon btn-sm" onclick={nextMatch}>{tr('findNext')}</button>
        </div>
      </div>
    {:else if searchText}
      <span class="no-matches">0 {tr('matchesFound')}</span>
    {/if}
  </div>
</div>

<style>
  .find-panel {
    position: fixed;
    top: 100px;
    right: 280px;
    width: 320px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    animation: slideUp 0.15s ease;
  }

  .find-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .find-title {
    font-size: 13px;
    font-weight: 600;
  }

  .find-body {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .find-row {
    display: flex;
    gap: 6px;
  }

  .match-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
  }

  .match-nav {
    display: flex;
    gap: 4px;
  }

  .no-matches {
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
