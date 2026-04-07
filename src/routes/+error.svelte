<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Error {$page.status} — Crown Wedding Films</title>
</svelte:head>

<div class="error-wrapper">
  <div class="error-card">
    <div class="error-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    
    <h1 class="error-status">{$page.status}</h1>
    
    <h2 class="error-title">
      {#if $page.status === 404}
        Page Not Found
      {:else if $page.status === 403}
        Access Denied
      {:else}
        Something went wrong
      {/if}
    </h2>
    
    <p class="error-message">
      {#if $page.error && $page.error.message}
        {$page.error.message}
      {:else if $page.status === 404}
        The page you are looking for doesn't exist or has been moved.
      {:else}
        An unexpected error occurred while processing your request. Please try again later.
      {/if}
    </p>

    <div class="error-actions">
      <button class="btn btn-ghost" onclick={() => window.history.back()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px"><polyline points="15 18 9 12 15 6"/></svg>
        Go Back
      </button>
      <a href="/" class="btn btn-primary">
        Return to Home
      </a>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--ink);
  }

  .error-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    background: radial-gradient(circle at center, var(--surface) 0%, var(--bg) 100%);
  }

  .error-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 48px 40px;
    max-width: 440px;
    width: 100%;
    text-align: center;
    box-shadow: var(--sh-lg);
    animation: fadein 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadein {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .error-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
    background: rgba(255, 59, 48, 0.1);
    color: var(--red);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-icon svg {
    width: 32px;
    height: 32px;
  }

  .error-status {
    font-size: 64px;
    font-weight: 800;
    line-height: 1;
    margin: 0 0 12px;
    background: linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.04em;
  }

  .error-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 12px;
    letter-spacing: -0.02em;
  }

  .error-message {
    font-size: 15px;
    color: var(--ink-2);
    line-height: 1.6;
    margin: 0 0 32px;
  }

  .error-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  @media (max-width: 480px) {
    .error-card {
      padding: 32px 24px;
    }
    .error-actions {
      flex-direction: column-reverse;
      gap: 10px;
    }
    .error-actions > * {
      width: 100%;
      justify-content: center;
    }
  }
</style>
