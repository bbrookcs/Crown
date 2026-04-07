<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let { form }: { form: any } = $props();
  let loading = $state(false);

  const user = $derived($page.data.user);

  function initials(name: string) {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/auth/login');
  }
</script>

<svelte:head><title>Profile — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title" style="margin: 0 auto;">Profile Settings</div>
</div>

<div class="page" style="max-width: 560px; margin: 40px auto; width: 100%; display: flex; flex-direction: column; gap: 24px;">

  <!-- Profile Card -->
  <div class="section-card">
    <div class="section-head"><span class="section-title">Account Details</span></div>
    <div class="section-body">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--ink);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">
          {initials(user?.name)}
        </div>
        <div>
          <div style="font-size:18px;font-weight:600;color:var(--ink)">{user?.name}</div>
          <div style="font-size:14px;color:var(--ink-2);margin-top:2px">{user?.email}</div>
          <div style="margin-top:6px"><span class="badge badge-selection" style="text-transform:capitalize">{user?.role}</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Security Card -->
  <div class="section-card">
    <div class="section-head"><span class="section-title">Change Password</span></div>
    <div class="section-body">
      {#if form?.error}
        <div class="alert alert-error" style="margin-bottom:16px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {form.error}
        </div>
      {/if}
      {#if form?.success}
        <div class="alert alert-success" style="margin-bottom:16px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Password updated successfully.
        </div>
      {/if}

      <form method="POST" class="form-grid" style="grid-template-columns:1fr" use:enhance={()=>{loading=true;return async({update})=>{loading=false;await update({reset:form?.success});}}}>
        <div class="form-group">
          <label class="form-label" for="current_password">Current Password</label>
          <input id="current_password" name="current_password" type="password" class="input" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="new_password">New Password</label>
          <input id="new_password" name="new_password" type="password" class="input" required minlength="6" />
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading}<span class="spin"></span>{/if}
            {loading ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Logout Button -->
  <div style="display: flex; justify-content: center; margin-top: 16px;">
    <button class="btn btn-danger" style="width: 100%; max-width: 320px; justify-content: center; padding: 12px; font-weight: 600; border-radius: var(--r-md); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);" onclick={logout}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Sign Out of My Account
    </button>
  </div>
</div>
