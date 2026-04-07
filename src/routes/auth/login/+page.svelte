<script lang="ts">
  let { form }: { form: any } = $props();
  let loading = $state(false);
  import { enhance } from '$app/forms';
</script>

<svelte:head><title>Sign In — Crown Wedding Films</title></svelte:head>

<div class="auth-wrap">
  <div class="auth-card">
    <div class="auth-logo-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    </div>

    <h1>Crown Wedding Films</h1>
    <p class="auth-sub">Sign in to your dashboard</p>

    {#if form?.error}
      <div class="alert alert-error" style="margin-bottom:16px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {form.error}
      </div>
    {/if}

    <form method="POST" class="auth-form"
      use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }}>

      <div class="form-group">
        <label class="form-label" for="email">Email</label>
        <input id="email" name="email" type="email" class="input" placeholder="Email" required value={form?.email ?? ''} />
      </div>

      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input id="password" name="password" type="password" class="input" placeholder="Password" required />
      </div>

      <button type="submit" class="btn btn-primary auth-submit" disabled={loading}>
        {#if loading}<span class="spin"></span>{/if}
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  </div>
</div>
