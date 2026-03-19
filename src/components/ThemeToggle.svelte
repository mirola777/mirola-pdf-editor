<script>
  import { theme } from '../stores/settingsStore.js';

  let current = $derived($theme);
</script>

<button
  class="theme-toggle"
  onclick={() => theme.toggle()}
  title={current === 'light' ? 'Dark mode' : 'Light mode'}
>
  <div class="toggle-track" class:dark={current === 'dark'}>
    <div class="toggle-thumb">
      {#if current === 'light'}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/></svg>
      {/if}
    </div>
  </div>
</button>

<style>
  .theme-toggle {
    background: none;
    padding: 0;
    display: flex;
    align-items: center;
  }

  .toggle-track {
    width: 48px;
    height: 26px;
    border-radius: 13px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    position: relative;
    transition: all 0.3s ease;
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    box-shadow: 0 2px 6px var(--accent-glow);
  }

  .dark .toggle-thumb {
    transform: translateX(22px);
  }
</style>
