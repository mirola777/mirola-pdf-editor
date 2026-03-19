<script>
  import { t } from '../stores/i18n.js';
  import { pdfStore } from '../stores/pdfStore.js';
  import { formatFileSize } from '../lib/fileUtils.js';

  let tr = $derived($t);
  let store = $derived($pdfStore);
</script>

<footer class="footer">
  <div class="footer-left">
    <span class="footer-brand">{tr('madeWith')} ♥ {tr('by')} <a href="https://github.com/mirola777" target="_blank" rel="noopener">mirola777</a></span>
    <span class="footer-sep">|</span>
    <span class="footer-desc">{tr('footerDesc')}</span>
  </div>

  <div class="footer-center">
    <span class="privacy-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      {tr('privacy')}
    </span>
  </div>

  <div class="footer-right">
    {#if store.fileName}
      <span class="footer-info">
        {store.totalPages} {store.totalPages === 1 ? 'page' : 'pages'}
        <span class="footer-sep">|</span>
        {formatFileSize(store.fileSize)}
      </span>
    {/if}
  </div>
</footer>

<style>
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 32px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
    font-size: 11px;
    color: var(--text-muted);
  }

  .footer-left, .footer-right, .footer-center {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .footer-brand a {
    color: var(--accent);
    text-decoration: none;
  }
  .footer-brand a:hover { text-decoration: underline; }

  .footer-sep { opacity: 0.4; }

  .privacy-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--success);
    font-size: 10px;
    font-weight: 500;
  }

  .footer-info {
    font-family: var(--font-mono);
    font-size: 11px;
  }

  @media (max-width: 768px) {
    .footer { height: 28px; padding: 0 10px; }
    .footer-desc, .footer-sep, .footer-center { display: none; }
  }
</style>
