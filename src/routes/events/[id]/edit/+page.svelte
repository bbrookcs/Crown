<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form }: { data: any; form: any } = $props();
  let loading = $state(false);

  const ev = data.event;

  let total = $state(Number(ev.total_price) || 0);
  let pre   = $state(Number(ev.prepayment)  || 0);
  const rem = $derived(total - pre);

  function toDateStr(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
  }
</script>

<svelte:head><title>Edit — {ev.groom_name} & {ev.bride_name}</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">Edit Booking</div>
  <div class="topbar-right">
    <a href="/events/{ev.id}" class="btn btn-ghost">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px"><polyline points="15 18 9 12 15 6"/></svg>
      Cancel
    </a>
  </div>
</div>

<!-- Centered container, same as event detail page -->
<div class="page">
  <div style="max-width:720px;margin:0 auto">

    {#if form?.error}
      <div class="alert alert-error" style="margin-bottom:18px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }}>

      <!-- Client -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Client Information</span>
        </div>
        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="gn">Groom Name *</label>
              <input id="gn" name="groom_name" type="text" class="input" required value={ev.groom_name} />
            </div>
            <div class="form-group">
              <label class="form-label" for="bn">Bride Name *</label>
              <input id="bn" name="bride_name" type="text" class="input" required value={ev.bride_name} />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="ph">Phone *</label>
              <input id="ph" name="phone" type="tel" class="input" required value={ev.phone} />
            </div>
          </div>
        </div>
      </div>

      <!-- Event Details -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Event Details</span>
        </div>
        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="bd">Booking Date *</label>
              <input id="bd" name="booking_date" type="date" class="input" required value={toDateStr(ev.booking_date)} />
            </div>
            <div class="form-group">
              <label class="form-label" for="ed">Wedding Date *</label>
              <input id="ed" name="event_date" type="date" class="input" required value={toDateStr(ev.event_date)} />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="st">Status</label>
              <select id="st" name="status" class="select">
                {#each ['Pending','Client Selection','Editing','Delivered'] as s}
                  <option value={s} selected={ev.status === s}>{s}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment — no Final Payment paid/unpaid -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Payment</span>
        </div>
        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="tp">Total Price *</label>
              <input id="tp" name="total_price" type="number" class="input" step="0.01" min="0" required bind:value={total} />
            </div>
            <div class="form-group">
              <label class="form-label" for="pr">Prepayment</label>
              <input id="pr" name="prepayment" type="number" class="input" step="0.01" min="0" bind:value={pre} />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Remaining (auto-calculated)</label>
              <div class="input" style="cursor:default;font-weight:700;color:{rem > 0 ? 'var(--red)' : 'var(--green)'}">
                {rem.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Storage -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Storage Disks</span>
        </div>
        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="sd">File Save Disk</label>
              <input id="sd" name="storage_disk_number" type="text" class="input" placeholder="e.g. HDD-01" value={ev.storage_disk_number || ''} />
            </div>
            <div class="form-group">
              <label class="form-label" for="bk">Backup Disk</label>
              <input id="bk" name="backup_disk_number" type="text" class="input" placeholder="e.g. BKP-01" value={ev.backup_disk_number || ''} />
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Notes</span>
        </div>
        <div class="section-body">
          <div class="form-group">
            <textarea name="notes" class="textarea" placeholder="Additional notes…">{ev.notes || ''}</textarea>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px">
        <a href="/events/{ev.id}" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {#if loading}<span class="spin"></span>{/if}
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  </div>
</div>
