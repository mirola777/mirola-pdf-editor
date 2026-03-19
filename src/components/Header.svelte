<script>
  import { t } from '../stores/i18n.js';
  import { pdfStore } from '../stores/pdfStore.js';
  import ThemeToggle from './ThemeToggle.svelte';
  import LanguageSelector from './LanguageSelector.svelte';

  let tr = $derived($t);
  let store = $derived($pdfStore);
</script>

<header class="header">
  <div class="header-left">
    <div class="logo">
      <svg width="28" height="28" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:var(--accent)"/>
            <stop offset="100%" style="stop-color:var(--accent-hover)"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="20" fill="url(#logoBg)"/>
        <g transform="translate(22,14)">
          <rect x="5" y="5" width="48" height="62" rx="4" fill="none" stroke="white" stroke-width="3"/>
          <line x1="15" y1="28" x2="43" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="15" y1="38" x2="38" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
          <line x1="15" y1="48" x2="33" y2="48" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
        </g>
      </svg>
      <span class="logo-text">{tr('appName')}</span>
    </div>
  </div>

  <div class="header-center">
    {#if store.fileName}
      <span class="file-name">{store.fileName}</span>
      {#if store.isModified}
        <span class="status-pill modified">{tr('modified')}</span>
      {:else}
        <span class="status-pill ready">{tr('ready')}</span>
      {/if}
    {/if}
  </div>

  <div class="header-right">
    <LanguageSelector />
    <ThemeToggle />
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 52px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    z-index: 10;
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-text {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text-primary);
  }

  .file-name {
    font-size: 13px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-pill {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-pill.modified {
    background: var(--warning);
    color: #000;
  }

  .status-pill.ready {
    background: var(--success);
    color: #fff;
  }

  @media (max-width: 768px) {
    .header { height: 46px; padding: 0 10px; }
    .logo-text { display: none; }
    .file-name { max-width: 120px; font-size: 11px; }
    .header-center .status-pill { display: none; }
  }
</style>
