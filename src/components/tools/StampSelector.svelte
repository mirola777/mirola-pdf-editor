<script>
  import { toolStore } from '../../stores/toolStore.js';
  import { t } from '../../stores/i18n.js';

  let tr = $derived($t);
  let tools = $derived($toolStore);

  const stamps = [
    { id: 'approved', color: '#16a34a' },
    { id: 'draft', color: '#f59e0b' },
    { id: 'confidential', color: '#ef4444' },
    { id: 'reviewed', color: '#3b82f6' },
  ];
</script>

<div class="stamp-grid">
  {#each stamps as stamp}
    <button
      class="stamp-btn"
      class:active={tools.stampType === stamp.id}
      style="--stamp-color: {stamp.color}"
      onclick={() => toolStore.setStampType(stamp.id)}
    >
      {tr('stamp' + stamp.id.charAt(0).toUpperCase() + stamp.id.slice(1))}
    </button>
  {/each}
</div>

<style>
  .stamp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .stamp-btn {
    padding: 8px;
    border-radius: var(--radius-sm);
    background: var(--bg-tertiary);
    border: 2px solid var(--border-color);
    color: var(--stamp-color);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .stamp-btn:hover { border-color: var(--stamp-color); }
  .stamp-btn.active {
    border-color: var(--stamp-color);
    background: color-mix(in srgb, var(--stamp-color) 10%, transparent);
  }
</style>
