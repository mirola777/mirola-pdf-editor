<script>
  import { toastStore } from '../stores/toastStore.js';

  let toasts = $derived($toastStore);
</script>

{#if toasts.length > 0}
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="toast toast-{toast.type}" onclick={() => toastStore.dismiss(toast.id)}>
        <span class="toast-icon">
          {#if toast.type === 'success'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {:else if toast.type === 'error'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          {/if}
        </span>
        <span class="toast-message">{toast.message}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 48px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    animation: toastIn 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    backdrop-filter: blur(8px);
    min-width: 220px;
    max-width: 380px;
  }

  .toast-success {
    background: rgba(22, 163, 74, 0.92);
    color: white;
  }
  .toast-error {
    background: rgba(239, 68, 68, 0.92);
    color: white;
  }
  .toast-info {
    background: rgba(59, 130, 246, 0.92);
    color: white;
  }

  .toast-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
    line-height: 1.3;
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
