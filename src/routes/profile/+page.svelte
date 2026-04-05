<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  let { form }: { form: any } = $props();
  let loading = $state(false);

  const user = $derived($page.data.user);

  function initials(name: string) {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<svelte:head><title>Profile — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">Profile Settings</div>
</div>

<div class="page" style="max-width:640px">

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
  <div class="section-card" style="margin-top:24px">
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
</div>
