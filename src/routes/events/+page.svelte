<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let search       = $state(data.search  || '');
  let filterStatus = $state(data.status  || '');

  // Inline status change — uses fixed-position dropdown to avoid table overflow clipping
  let openDropdown: number | null = $state(null);
  let dropdownPos  = $state({ top: 0, left: 0 });
  let openEvent: any | null = $state(null);

  let confirmChange: { id: number; newStatus: string; name: string } | null = $state(null);
  let saving   = $state(false);
  let delId: number | null = $state(null);
  let deleting = $state(false);
  let toast: { msg: string; ok: boolean } | null = $state(null);
  let searchTimer: ReturnType<typeof setTimeout>;

  /* ── Filters ────────────────────────────────── */
  function applyFilters() {
    const q = new URLSearchParams();
    if (search.trim())  q.set('search', search.trim());
    if (filterStatus)   q.set('status', filterStatus);
    goto(`/events${q.toString() ? '?' + q : ''}`, { replaceState: true, invalidateAll: true });
  }
  function onSearchInput() { clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 380); }
  function onStatusFilterChange() { applyFilters(); }
  function clearFilters() { search = ''; filterStatus = ''; goto('/events', { replaceState: true, invalidateAll: true }); }

  /* ── Status dropdown per-status rules ───────── */
  function getStatusOptions(current: string): string[] {
    if (current === 'Delivered')        return [];  // no change allowed
    if (current === 'File Selection') return ['Editing', 'Delivered'];
    if (current === 'Editing')          return ['File Selection', 'Delivered'];
    return ['File Selection', 'Editing', 'Delivered']; // Pending
  }

  function openStatusDropdown(ev: any, e: MouseEvent) {
    const opts = getStatusOptions(ev.status);
    if (!opts.length) return; // Delivered — no dropdown
    if (openDropdown === ev.id) { openDropdown = null; openEvent = null; return; }

    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    // Use fixed so dropdown escapes table overflow
    dropdownPos = { top: rect.bottom + 4, left: rect.left };
    openDropdown = ev.id;
    openEvent = ev;
  }

  function closeDropdown() { openDropdown = null; openEvent = null; }

  function pickStatus(newStatus: string) {
    if (!openEvent) return;
    confirmChange = { id: openEvent.id, newStatus, name: `${openEvent.groom_name} & ${openEvent.bride_name}` };
    closeDropdown();
  }

  async function confirmStatusChange() {
    if (!confirmChange) return;
    saving = true;
    const r = await fetch(`/api/events/${confirmChange.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: confirmChange.newStatus })
    });
    saving = false;
    if (r.ok) { showToast('Status updated'); confirmChange = null; goto('/events', { invalidateAll: true }); }
    else showToast('Failed to update', false);
  }

  /* ── Delete ─────────────────────────────────── */
  async function doDelete() {
    if (!delId) return;
    deleting = true;
    const r = await fetch(`/api/events/${delId}`, { method: 'DELETE' });
    deleting = false;
    if (r.ok) { showToast('Event deleted'); delId = null; goto('/events', { invalidateAll: true }); }
    else showToast('Delete failed', false);
  }

  function showToast(msg: string, ok = true) { toast = { msg, ok }; setTimeout(() => (toast = null), 3000); }

  /* ── Helpers ────────────────────────────────── */
  const statusClass: Record<string, string> = {
    'Pending': 'badge-pending', 'File Selection': 'badge-selection',
    'Editing': 'badge-editing', 'Delivered': 'badge-delivered'
  };
  const fmtNum  = (n: number) => n != null ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(n) : '—';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const hasFilters = $derived(!!(data.search || data.status));
</script>

<svelte:head><title>Events — Crown Wedding Films</title></svelte:head>

<!-- Fixed-position dropdown (escapes table overflow) -->
{#if openDropdown !== null && openEvent}
  <!-- Backdrop to close -->
  <div style="position:fixed;inset:0;z-index:998" onclick={closeDropdown} role="presentation"></div>
  <!-- Dropdown -->
  <div style="
    position:fixed;
    top:{dropdownPos.top}px;
    left:{dropdownPos.left}px;
    z-index:999;
    background:var(--surface);
    border:1px solid var(--border-md);
    border-radius:var(--r-lg);
    padding:4px;
    min-width:175px;
    box-shadow:var(--sh-md);
    animation:slideup 140ms var(--ease)
  ">
    {#each getStatusOptions(openEvent.status) as opt}
      <button
        style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border:none;background:none;cursor:pointer;font-size:13px;border-radius:var(--r-sm);text-align:left;font-family:inherit;color:var(--ink-2)"
        onclick={() => pickStatus(opt)}
        onmouseenter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'}
        onmouseleave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
      >
        <span class="badge {statusClass[opt]}" style="font-size:11px;padding:2px 8px">{opt}</span>
      </button>
    {/each}
  </div>
{/if}

<div class="topbar">
  <div class="topbar-title">
    Events
    <span style="font-size:13px;font-weight:400;color:var(--ink-3);margin-left:8px">{data.events.length} results</span>
  </div>
  <div class="topbar-right">
    <a href="/events/new" class="btn btn-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New Event
    </a>
  </div>
</div>

<div class="page">

  <!-- Filter bar -->
  <div class="card" style="padding:12px 16px;margin-bottom:16px">
    <div class="search-row">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="input" placeholder="Search couple or phone…" bind:value={search} oninput={onSearchInput} />
      </div>

      <select class="select" style="width:190px" bind:value={filterStatus} onchange={onStatusFilterChange}>
        <option value="">All Statuses</option>
        {#each ['Pending','File Selection','Editing','Delivered'] as s}
          <option value={s}>{s}</option>
        {/each}
      </select>

      {#if hasFilters}
        <button class="btn btn-ghost btn-sm" onclick={clearFilters} style="gap:5px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Clear
        </button>
      {/if}
    </div>
  </div>

  <!-- Table -->
  {#if data.events.length === 0}
    <div class="table-wrap">
      <div class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3>No events found</h3>
        <p>Try a different search or add a new booking.</p>
        <a href="/events/new" class="btn btn-primary" style="margin-top:16px">New Event</a>
      </div>
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Couple</th>
            <th>Category</th>
            <th>Wedding Date</th>
            <th>Status</th>
            <th>Total Payment</th>
            <th>Remaining</th>
            <th>Storage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.events as ev, i}
            {@const isDelivered = ev.status === 'Delivered'}
            {@const opts = getStatusOptions(ev.status)}
            {@const catObj = typeof ev.categories === 'string' ? (JSON.parse(ev.categories || '[]') || []) : (ev.categories || [])}
            {@const catNames = Array.isArray(catObj) ? catObj.map((c: any) => typeof c === 'string' ? c : c.name).join(', ') : ''}
            <tr>
              <td style="color:var(--ink-3);font-size:12px;width:36px">{i + 1}</td>

              <!-- Couple -->
              <td>
                <div style="font-weight:600">{ev.groom_name} &amp; {ev.bride_name}</div>
                <div style="font-size:12px;color:var(--ink-3);margin-top:1px">{ev.phone}</div>
              </td>

              <!-- Category -->
              <td style="color:var(--ink-2);max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title={catNames}>
                {catNames || '—'}
              </td>

              <!-- Date -->
              <td style="color:var(--ink-2);white-space:nowrap">{fmtDate(ev.event_date)}</td>

              <!-- Status — clickable if not Delivered or Pending -->
              <td>
                {#if isDelivered || ev.status === 'Pending'}
                  <!-- Delivered or Pending: just a static badge, no dropdown -->
                  <span class="badge badge-delivered">{ev.status}</span>
                {:else}
                  <button
                    style="display:inline-flex;align-items:center;gap:5px;border:none;padding:0;background:none;cursor:pointer;font-family:inherit"
                    onclick={e => openStatusDropdown(ev, e)}
                  >
                    <span class="badge {statusClass[ev.status]}" style="cursor:pointer">{ev.status}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                      style="width:11px;height:11px;color:var(--ink-3);flex-shrink:0">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                {/if}
              </td>

              <!-- Total (hidden for Delivered) -->
              <td style="font-weight:600;color:var(--ink)">
                {#if !isDelivered}{fmtNum(ev.total_price)}{:else}<span style="color:var(--ink-3)">—</span>{/if}
              </td>

              <!-- Remaining (hidden for Delivered) -->
              <td style="font-weight:600">
                {#if !isDelivered}
                  <span style="color:{Number(ev.remaining_amount) > 0 ? 'var(--red)' : 'var(--green)'}">
                    {fmtNum(ev.remaining_amount)}
                   </span>
                {:else}
                  <span style="color:var(--ink-3)">—</span>
                {/if}
              </td>

              <!-- Storage -->
              <td style="color:var(--ink-2);white-space:nowrap">
                {ev.storage_disk_number || '—'}
              </td>

              <!-- Actions -->
              <td>
                <div class="actions">
                  <a href="/events/{ev.id}" class="btn btn-ghost btn-icon" title="View">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </a>
                  <a href="/events/{ev.id}/edit" class="btn btn-ghost btn-icon" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </a>
                  <button class="btn btn-danger btn-icon" title="Delete" onclick={() => delId = ev.id}>
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

<!-- Status Confirmation Modal -->
{#if confirmChange}
  <div class="overlay" onclick={() => confirmChange = null} role="dialog" aria-modal="true">
    <div class="modal" onclick={e => e.stopPropagation()} role="document" style="max-width:400px">
      <div class="modal-head">
        <h3>Change Status</h3>
        <button class="btn btn-ghost btn-icon btn-sm" onclick={() => confirmChange = null}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px;color:var(--ink-2);line-height:1.6;margin-bottom:14px">
          Change status for <strong style="color:var(--ink)">{confirmChange.name}</strong> to:
        </p>
        <span class="badge {statusClass[confirmChange.newStatus]}" style="font-size:13px;padding:5px 14px">
          {confirmChange.newStatus}
        </span>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" onclick={() => confirmChange = null}>Cancel</button>
        <button class="btn btn-primary" onclick={confirmStatusChange} disabled={saving}>
          {#if saving}<span class="spin"></span>{/if}
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation -->
{#if delId}
  <div class="overlay" onclick={() => delId = null} role="dialog" aria-modal="true">
    <div class="modal" onclick={e => e.stopPropagation()} role="document" style="max-width:400px">
      <div class="modal-head">
        <h3>Delete Event</h3>
        <button class="btn btn-ghost btn-icon btn-sm" onclick={() => delId = null}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px;color:var(--ink-2);line-height:1.6">
          Are you sure you want to delete this booking? This action cannot be undone.
        </p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" onclick={() => delId = null}>Cancel</button>
        <button class="btn btn-danger" onclick={doDelete} disabled={deleting}>
          {#if deleting}<span class="spin"></span>{/if}
          Delete Event
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Toast -->
{#if toast}
  <div class="toast-wrap">
    <div class="toast {toast.ok ? 'toast-ok' : 'toast-err'}">
      {#if toast.ok}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="color:var(--green)"><polyline points="20 6 9 17 4 12"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="color:var(--red)"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      {/if}
      {toast.msg}
    </div>
  </div>
{/if}
