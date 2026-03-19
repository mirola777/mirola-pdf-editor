<script>
  import { locale, availableLocales } from '../stores/i18n.js';

  let currentLocale = $derived($locale);
  let isOpen = $state(false);

  function selectLang(code) {
    locale.setLang(code);
    isOpen = false;
  }

  function handleClickOutside(e) {
    if (isOpen) isOpen = false;
  }

  let currentFlag = $derived(availableLocales.find(l => l.code === currentLocale)?.flag || '🌐');
</script>

<svelte:window onclick={handleClickOutside} />

<div class="lang-wrapper">
  <button class="lang-btn" onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }} title="Language">
    <span class="lang-flag">{currentFlag}</span>
    <span class="lang-code">{currentLocale.toUpperCase()}</span>
    <svg class="lang-chevron" class:open={isOpen} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
  </button>

  {#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="lang-dropdown" onclick={(e) => e.stopPropagation()}>
      {#each availableLocales as lang}
        <button
          class="lang-option"
          class:active={currentLocale === lang.code}
          onclick={() => selectLang(lang.code)}
        >
          <span class="option-flag">{lang.flag}</span>
          <span class="option-label">{lang.label}</span>
          {#if currentLocale === lang.code}
            <svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .lang-wrapper { position: relative; }

  .lang-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 20px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .lang-btn:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .lang-flag { font-size: 14px; line-height: 1; }
  .lang-code { letter-spacing: 0.5px; }

  .lang-chevron {
    color: var(--text-muted);
    transition: transform 0.2s ease;
  }
  .lang-chevron.open { transform: rotate(180deg); }

  .lang-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 160px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 4px;
    z-index: 100;
    animation: dropIn 0.15s ease;
  }

  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .lang-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    background: none;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    text-align: left;
  }
  .lang-option:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  .lang-option.active {
    background: var(--accent-light);
    color: var(--accent);
  }

  .option-flag { font-size: 16px; }
  .option-label { flex: 1; }
  .check { flex-shrink: 0; }

  @media (max-width: 768px) {
    .lang-code { display: none; }
    .lang-btn { padding: 5px 8px; }
  }
</style>
