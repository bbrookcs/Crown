<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showModal = $state(false);
  let submitting = $state(false);

  // For delete confirmation
  let delId: number | null = $state(null);
  let deleting = $state(false);

  // Add User Form state
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let role = $state('editor');

  const roles = [
    { value: 'admin', label: 'Admin (Full Access)' },
    { value: 'editor', label: 'Editor (Manage Events)' },
    { value: 'viewer', label: 'Viewer (Read Only)' }
  ];

  function closeModal() {
    showModal = false;
    name = '';
    email = '';
    password = '';
    role = 'viewer';
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
</script>

<svelte:head><title>Users — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">
    User Management
    <span style="font-size:13px;font-weight:400;color:var(--ink-3);margin-left:8px">{data.users.length} users</span>
  </div>
  <div class="topbar-right">
    <button class="btn btn-primary" onclick={() => showModal = true}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add User
    </button>
  </div>
</div>

<div class="page">
  <!-- Table -->
  {#if data.users.length === 0}
    <div class="table-wrap">
      <div class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h3>No users found</h3>
        <p>There are no registered users in the system.</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick={() => showModal = true}>Add User</button>
      </div>
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Added On</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.users as u (u.id)}
            <tr>
              <td>
                <div style="font-weight:600">{u.name}</div>
              </td>
              <td style="color:var(--ink-2)">{u.email}</td>
              <td>
                <span class="badge" style="background:var(--surface-3);color:var(--ink)">
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
              </td>
              <td style="color:var(--ink-2);white-space:nowrap">{fmtDate(u.created_at)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-danger btn-icon" title="Delete User" onclick={() => delId = u.id}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Add User Modal -->
{#if showModal}
  <div class="overlay" onclick={closeModal} role="dialog" aria-modal="true">
    <div class="modal" onclick={e => e.stopPropagation()} role="document" style="max-width:450px">
      <div class="modal-head">
        <h3>Add User</h3>
        <button class="btn btn-ghost btn-icon btn-sm" onclick={closeModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form method="POST" action="?/add" use:enhance={() => {
        submitting = true;
        return async ({ update, result }) => {
          submitting = false;
          if (result.type === 'success') closeModal();
          await update();
        };
      }}>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:16px;">
          {#if form?.error}
            <div class="toast-err" style="padding:12px;border-radius:var(--r-sm);font-size:13px;display:flex;align-items:center;gap:8px;">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               {form.error}
            </div>
          {/if}

          <div style="display:flex;flex-direction:column;gap:6px">
            <label for="name" style="font-size:13px;font-weight:600;color:var(--ink-2)">Full Name</label>
            <input type="text" id="name" name="name" class="input" bind:value={name} placeholder="Abebe" required autofocus />
          </div>

          <div style="display:flex;flex-direction:column;gap:6px">
            <label for="email" style="font-size:13px;font-weight:600;color:var(--ink-2)">Email Address</label>
            <input type="email" id="email" name="email" class="input" bind:value={email} placeholder="Abebe@example.com" required />
          </div>

          <div style="display:flex;flex-direction:column;gap:6px">
            <label for="password" style="font-size:13px;font-weight:600;color:var(--ink-2)">Password</label>
            <input type="password" id="password" name="password" class="input" bind:value={password} placeholder="••••••••" required />
          </div>

          <div style="display:flex;flex-direction:column;gap:6px">
            <label for="role" style="font-size:13px;font-weight:600;color:var(--ink-2)">System Role</label>
            <select id="role" name="role" class="select" bind:value={role}>
              {#each roles as r}
                <option value={r.value}>{r.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn btn-secondary" onclick={closeModal}>Cancel</button>
          <button type="submit" class="btn btn-primary" disabled={submitting}>
            {#if submitting}<span class="spin"></span>{/if}
            Create User
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if delId}
  <div class="overlay" onclick={() => delId = null} role="dialog" aria-modal="true">
    <div class="modal" onclick={e => e.stopPropagation()} role="document" style="max-width:400px">
      <div class="modal-head">
        <h3>Delete User</h3>
        <button class="btn btn-ghost btn-icon btn-sm" onclick={() => delId = null}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form method="POST" action="?/delete" use:enhance={() => {
        deleting = true;
        return async ({ update, result }) => {
          deleting = false;
          if (result.type === 'success') delId = null;
          await update();
        };
      }}>
        <div class="modal-body">
          <p style="font-size:14px;color:var(--ink-2);line-height:1.6">
            Are you sure you want to delete this user? They will immediately lose access to the system. This cannot be undone.
          </p>
          <input type="hidden" name="id" value={delId} />
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-secondary" onclick={() => delId = null}>Cancel</button>
          <button type="submit" class="btn btn-danger" disabled={deleting}>
            {#if deleting}<span class="spin"></span>{/if}
            Delete User
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
