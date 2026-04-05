<script lang="ts">
  import { goto } from '$app/navigation';

  let loading = $state(false);
  let errMsg  = $state('');

  // Client
  let groom_name = $state('');
  let bride_name = $state('');
  let phone      = $state('');

  // Event
  let booking_date = $state(new Date().toISOString().slice(0, 10));
  let event_date   = $state('');
  let status       = $state('Pending');

  // Payment
  let total_price = $state<number | ''>('');
  let prepayment  = $state<number | ''>('');
  const rem = $derived((Number(total_price) || 0) - (Number(prepayment) || 0));

  // Storage
  let storage_disk_number = $state('');
  let backup_disk_number  = $state('');

  // Notes
  let notes = $state('');

  // Files
  let pdfFile: File | null     = $state(null);
  let receiptFile: File | null = $state(null);

  async function submit() {
    if (!groom_name.trim() || !bride_name.trim() || !phone.trim() || !booking_date || !event_date) {
      errMsg = 'Please fill all required fields (names, phone, and both dates).';
      return;
    }
    loading = true;
    errMsg = '';

    // 1 — Create event
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groom_name, bride_name, phone, booking_date, event_date, status,
        total_price: Number(total_price) || 0,
        prepayment:  Number(prepayment)  || 0,
        storage_disk_number: storage_disk_number || null,
        backup_disk_number:  backup_disk_number  || null,
        notes: notes || null
      })
    });

    if (!res.ok) {
      errMsg = 'Failed to create event. Please try again.';
      loading = false;
      return;
    }

    const { id } = await res.json();

    // 2 — Upload agreement PDF
    if (pdfFile) {
      const fd = new FormData();
      fd.append('file', pdfFile);
      fd.append('event_id', String(id));
      fd.append('type', 'agreement');
      await fetch('/api/upload', { method: 'POST', body: fd });
    }

    // 3 — Upload prepayment receipt
    if (receiptFile) {
      const fd = new FormData();
      fd.append('file', receiptFile);
      fd.append('event_id', String(id));
      fd.append('type', 'receipt');
      fd.append('amount', String(Number(prepayment) || 0));
      fd.append('description', 'Prepayment');
      await fetch('/api/upload', { method: 'POST', body: fd });
    }

    goto(`/events/${id}`);
  }
</script>

<svelte:head><title>New Event — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">New Booking</div>
  <div class="topbar-right">
    <a href="/events" class="btn btn-ghost">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px"><polyline points="15 18 9 12 15 6"/></svg>
      Cancel
    </a>
  </div>
</div>

<div class="page">
  <div style="max-width:720px;margin:0 auto">

    {#if errMsg}
      <div class="alert alert-error" style="margin-bottom:18px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {errMsg}
      </div>
    {/if}

    <!-- Single unified section card -->
    <div class="section-card">
      <div class="section-head">
        <span class="section-title">Booking Details</span>
      </div>
      <div class="section-body">

        <!-- CLIENT -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Client</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label class="form-label" for="gn">Groom Name *</label>
            <input id="gn" type="text" class="input" placeholder="First & last name" bind:value={groom_name} />
          </div>
          <div class="form-group">
            <label class="form-label" for="bn">Bride Name *</label>
            <input id="bn" type="text" class="input" placeholder="First & last name" bind:value={bride_name} />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label" for="ph">Phone *</label>
            <input id="ph" type="tel" class="input" placeholder="+966…" bind:value={phone} />
          </div>
        </div>

        <hr class="divider" />

        <!-- EVENT -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Event</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label class="form-label" for="bd">Booking Date *</label>
            <input id="bd" type="date" class="input" bind:value={booking_date} />
          </div>
          <div class="form-group">
            <label class="form-label" for="ed">Wedding Date *</label>
            <input id="ed" type="date" class="input" bind:value={event_date} />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label" for="st">Status</label>
            <select id="st" class="select" bind:value={status}>
              {#each ['Pending','Client Selection','Editing','Delivered'] as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
        </div>

        <hr class="divider" />

        <!-- PAYMENT -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Payment</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label class="form-label" for="tp">Total Price</label>
            <input id="tp" type="number" class="input" placeholder="0" bind:value={total_price} min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label class="form-label" for="pr">Prepayment</label>
            <input id="pr" type="number" class="input" placeholder="0" bind:value={prepayment} min="0" step="0.01" />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label">Remaining (auto)</label>
            <div class="input" style="cursor:default;font-weight:700;color:{rem > 0 ? 'var(--red)' : rem < 0 ? 'var(--red)' : 'var(--green)'}">
              {rem.toFixed(2)}
            </div>
          </div>
        </div>

        <hr class="divider" />

        <!-- STORAGE -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Storage Disks</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label class="form-label" for="sd">File Save Disk</label>
            <input id="sd" type="text" class="input" placeholder="e.g. HDD-01" bind:value={storage_disk_number} />
          </div>
          <div class="form-group">
            <label class="form-label" for="bk">Backup Disk</label>
            <input id="bk" type="text" class="input" placeholder="e.g. BKP-01" bind:value={backup_disk_number} />
          </div>
        </div>

        <hr class="divider" />

        <!-- NOTES -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Notes</div>
        <div class="form-group" style="margin-bottom:20px">
          <textarea class="textarea" placeholder="Any additional notes…" bind:value={notes}></textarea>
        </div>

        <hr class="divider" />

        <!-- FILES -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Files (optional)</div>
        <div class="form-grid">

          <!-- Agreement PDF -->
          <div class="form-group">
            <label class="form-label" for="pdfInput">Agreement PDF</label>
            <label
              for="pdfInput"
              class="upload-zone"
              style="display:block;cursor:pointer;text-align:center;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"
            >
              {#if pdfFile}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--blue)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style="font-size:12.5px;color:var(--blue);font-weight:500">{pdfFile.name}</span>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--ink-3)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style="font-size:12.5px;color:var(--ink-2)">Click to select PDF</span>
              {/if}
            </label>
            <input id="pdfInput" type="file" accept=".pdf" style="display:none"
              onchange={e => { pdfFile = (e.target as HTMLInputElement).files?.[0] || null; }} />
          </div>

          <!-- Prepayment Receipt -->
          <div class="form-group">
            <label class="form-label" for="rcptInput">Prepayment Receipt</label>
            <label
              for="rcptInput"
              class="upload-zone"
              style="display:block;cursor:pointer;text-align:center;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"
            >
              {#if receiptFile}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--green)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style="font-size:12.5px;color:var(--green);font-weight:500">{receiptFile.name}</span>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--ink-3)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style="font-size:12.5px;color:var(--ink-2)">Click to select file</span>
              {/if}
            </label>
            <input id="rcptInput" type="file" accept="image/*,.pdf" style="display:none"
              onchange={e => { receiptFile = (e.target as HTMLInputElement).files?.[0] || null; }} />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px">
      <a href="/events" class="btn btn-secondary">Cancel</a>
      <button class="btn btn-primary" onclick={submit} disabled={loading}>
        {#if loading}<span class="spin"></span>{/if}
        {loading ? 'Creating…' : 'Create Booking'}
      </button>
    </div>
  </div>
</div>
