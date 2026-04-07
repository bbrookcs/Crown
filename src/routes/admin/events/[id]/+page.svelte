<script lang="ts">
  import { goto } from '$app/navigation';

  let { data }: { data: any } = $props();
  const ev     = data.event;
  let receipts = $state([...data.receipts]);

  const catObj = typeof ev.categories === 'string' ? (JSON.parse(ev.categories || '[]') || []) : (ev.categories || []);
  const hasCategories = Array.isArray(catObj) && catObj.length > 0;
  const crewObj = typeof ev.crew === 'string' ? (JSON.parse(ev.crew || '[]') || []) : (ev.crew || []);

  // Status
  let selStatus = $state(ev.status);
  let updStatus = $state(false);

  // Storage Editing
  let editingStorage = $state(false);
  let editStorageVal = $state(ev.storage_disk_number || '');
  let editBackupVal = $state(ev.backup_disk_number || '');
  let savingStorage = $state(false);

  async function saveStorage() {
    savingStorage = true;
    const r = await fetch(`/api/events/${ev.id}/storage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_disk_number: editStorageVal, backup_disk_number: editBackupVal })
    });
    savingStorage = false;
    if (r.ok) {
      ev.storage_disk_number = editStorageVal;
      ev.backup_disk_number = editBackupVal;
      editingStorage = false;
      showToast('Storage updated');
    } else {
      showToast('Update failed', false);
    }
  }

  // Upload state
  let uploadingPDF = $state(false);
  let recFile: File | null = $state(null);
  let recType = $state('');
  let uploadingRec = $state(false);

  let toast: { msg: string; ok: boolean } | null = $state(null);

  /* ── Receipt checks ─────────────────────────── */
  const hPre = $derived(receipts.some((r: any) => r.description === 'Prepayment'));
  const hFin = $derived(receipts.some((r: any) => r.description === 'Final Payment'));
  const showReceiptUpload = $derived(!hPre || !hFin);
  const showPDFUpload     = $derived(!ev.agreement_pdf_url);
  const allUploaded       = $derived(!showPDFUpload && !showReceiptUpload);
  const availableTypes    = $derived([...(!hPre ? ['Prepayment'] : []), ...(!hFin ? ['Final Payment'] : [])]);

  $effect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(recType)) {
      recType = availableTypes[0];
    }
  });

  const recAmount = $derived(recType === 'Prepayment' ? ev.prepayment : ev.remaining_amount);

  /* ── Helpers ─────────────────────────────────── */
  const fmt = (n: number) =>
    n != null ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(n) : '—';

  function fmtDate(d: any): string {
    if (!d) return '—';
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const statusClass: Record<string, string> = {
    'Pending': 'badge-pending', 'File Selection': 'badge-selection',
    'Editing': 'badge-editing', 'Delivered': 'badge-delivered'
  };

  function showToast(msg: string, ok = true) {
    toast = { msg, ok }; setTimeout(() => (toast = null), 3200);
  }

  /* ── Status update ──────────────────────────── */
  async function updateStatus() {
    if (selStatus === ev.status) return;
    updStatus = true;
    const r = await fetch(`/api/events/${ev.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: selStatus })
    });
    updStatus = false;
    if (r.ok) { showToast('Status updated'); goto(`/admin/events/${ev.id}`, { invalidateAll: true }); }
    else showToast('Update failed', false);
  }

  /* ── PDF upload ─────────────────────────────── */
  async function uploadPDF(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    uploadingPDF = true;
    const fd = new FormData();
    fd.append('file', f); fd.append('event_id', String(ev.id)); fd.append('type', 'agreement');
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    uploadingPDF = false;
    if (r.ok) { showToast('Agreement uploaded'); goto(`/admin/events/${ev.id}`, { invalidateAll: true }); }
    else showToast('Upload failed', false);
  }

  /* ── Receipt upload ─────────────────────────── */
  async function uploadReceipt() {
    if (!recFile || !recType) return;
    uploadingRec = true;
    const fd = new FormData();
    fd.append('file', recFile);
    fd.append('event_id', String(ev.id));
    fd.append('type', 'receipt');
    fd.append('amount', String(recAmount ?? 0));
    fd.append('description', recType);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    uploadingRec = false;
    if (r.ok) {
      const { receipt } = await r.json();
      receipts = [receipt, ...receipts];
      recFile = null;
      showToast('Receipt uploaded');
    } else showToast('Upload failed', false);
  }

  async function delReceipt(id: number) {
    const r = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
    if (r.ok) { receipts = receipts.filter((x: any) => x.id !== id); showToast('Removed'); }
    else showToast('Failed', false);
  }
</script>

<svelte:head><title>{ev.groom_name} & {ev.bride_name} — Crown Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">{ev.groom_name} &amp; {ev.bride_name}</div>
  <div class="topbar-right">
    <a href="/admin/events/{ev.id}/edit" class="btn btn-secondary">Edit</a>
    <a href="/admin/events" class="btn btn-ghost">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px"><polyline points="15 18 9 12 15 6"/></svg>
      Back
    </a>
  </div>
</div>

<div class="page">
  <div style="max-width:760px;margin:0 auto;transition:max-width 300ms">

    <!-- Status bar -->
    <div class="card" style="padding:13px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12.5px;color:var(--ink-3)">Current Status</span>
        <span class="badge {statusClass[ev.status]}" style="font-size:12.5px;padding:4px 12px">{ev.status}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <select class="select" style="width:200px" bind:value={selStatus}>
          {#each ['Pending','File Selection','Editing','Delivered'] as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
        <button class="btn btn-primary btn-sm" onclick={updateStatus} disabled={updStatus || selStatus === ev.status}>
          {updStatus ? 'Saving…' : 'Update'}
        </button>
      </div>
    </div>

    <!-- Main single column constraint -->
    <div style="display:flex;flex-direction:column;gap:20px;">

      <!-- ════ ALL INFO ════ -->
      <div class="section-card" style="margin-bottom:0">
        <div class="section-head">
          <span class="section-title">Booking Information</span>
        </div>
        <div class="section-body">

          <!-- CLIENT -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Client</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
            <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Groom</div><div style="font-size:14.5px;font-weight:500;color:var(--ink)">{ev.groom_name}</div></div>
            <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Bride</div><div style="font-size:14.5px;font-weight:500;color:var(--ink)">{ev.bride_name}</div></div>
            <div style="grid-column:1/-1"><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Phone</div><div style="font-size:14.5px;font-weight:500;color:var(--ink)">{ev.phone}</div></div>
          </div>

          <hr class="divider" />

          <!-- EVENT DATES -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Event</div>
          
          {#if !hasCategories}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
              <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Event Date</div><div style="font-size:14.5px;font-weight:500;color:var(--ink)">{fmtDate(ev.event_date)}</div></div>
              <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Event Location</div><div style="font-size:14.5px;font-weight:500;color:{ev.event_location?'var(--ink)':'var(--ink-3)'}">{ev.event_location || '—'}</div></div>
              <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Booking Date</div><div style="font-size:14.5px;font-weight:500;color:var(--ink)">{fmtDate(ev.booking_date)}</div></div>
            </div>
          {:else}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Booking Date</div><div style="font-size:14.5px;font-weight:500;color:var(--ink)">{fmtDate(ev.booking_date)}</div></div>
            </div>
            {#each catObj as cat}
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed var(--border)">
                <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">{typeof cat === 'string' ? cat : cat.name} Date</div><div style="font-size:14.5px;font-weight:500;color:{cat.date?'var(--ink)':'var(--ink-3)'}">{cat.date ? fmtDate(cat.date) : '—'}</div></div>
                <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">{typeof cat === 'string' ? cat : cat.name} Location</div><div style="font-size:14.5px;font-weight:500;color:{cat.location?'var(--ink)':'var(--ink-3)'}">{cat.location || '—'}</div></div>
              </div>
            {/each}
            <div style="margin-bottom:8px"></div>
          {/if}

          {#if crewObj.length > 0}
            <hr class="divider" />
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Crew</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
              {#each crewObj as c}
                <span class="badge" style="background:var(--surface-2);color:var(--ink-2);border:1px solid var(--border-md)">{c}</span>
              {/each}
            </div>
          {/if}

          <hr class="divider" />

          <!-- PAYMENT (no Payment Status row) -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Payment</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px">
            <div class="pay-row"><span class="pay-label">Total Price</span><span class="pay-value">{fmt(ev.total_price)}</span></div>
            <div class="pay-row"><span class="pay-label">Prepayment</span><span class="pay-value" style="color:var(--green)">{fmt(ev.prepayment)}</span></div>
            <div class="pay-row" style="border:1px solid {Number(ev.remaining_amount)>0?'rgba(255,59,48,.2)':'rgba(52,199,89,.2)'}">
              <span class="pay-label">Remaining</span>
              <span class="pay-value" style="color:{Number(ev.remaining_amount)>0?'var(--red)':'var(--green)'}">{fmt(ev.remaining_amount)}</span>
            </div>
          </div>

          <hr class="divider" />

          <!-- STORAGE -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue)">Storage Disks</div>
            {#if !editingStorage}
              <button class="btn btn-ghost btn-sm" style="height:24px;padding:0 8px;font-size:11px" onclick={() => editingStorage = true}>Edit</button>
            {/if}
          </div>
          
          {#if editingStorage}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;background:var(--surface-2);padding:12px;border-radius:var(--r-md);border:1px solid var(--border)">
              <div>
                <label class="form-label" style="font-size:10px">File Save Disk</label>
                <input type="text" class="input" style="padding:6px 10px;font-size:13px" bind:value={editStorageVal} placeholder="e.g. HDD-01" />
              </div>
              <div>
                <label class="form-label" style="font-size:10px">Backup Disk</label>
                <input type="text" class="input" style="padding:6px 10px;font-size:13px" bind:value={editBackupVal} placeholder="e.g. BKP-01" />
              </div>
              <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:6px">
                <button class="btn btn-ghost btn-sm" onclick={() => editingStorage = false}>Cancel</button>
                <button class="btn btn-primary btn-sm" onclick={saveStorage} disabled={savingStorage}>{savingStorage ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          {:else}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
              <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">File Save Disk</div><div style="font-size:14.5px;font-weight:500;color:{ev.storage_disk_number?'var(--ink)':'var(--ink-3)'}">{ev.storage_disk_number || '—'}</div></div>
              <div><div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:3px">Backup Disk</div><div style="font-size:14.5px;font-weight:500;color:{ev.backup_disk_number?'var(--ink)':'var(--ink-3)'}">{ev.backup_disk_number || '—'}</div></div>
            </div>
          {/if}

          {#if ev.notes}
            <hr class="divider" />
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:8px">Notes</div>
            <p style="font-size:14px;line-height:1.65;color:var(--ink-2);margin-bottom:18px">{ev.notes}</p>
          {/if}

          <hr class="divider" />

          <!-- DOCUMENTS & FILES -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:12px">Documents & Files</div>

          <!-- Agreement PDF -->
          <div style="margin-bottom:14px">
            <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:6px">Agreement PDF</div>
            {#if ev.agreement_pdf_url}
              <a href={ev.agreement_pdf_url} target="_blank" rel="noopener" class="file-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:13px;height:13px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Agreement PDF — Open
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:12px;height:12px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            {:else}
              <span style="font-size:13px;color:var(--ink-3)">Not uploaded yet</span>
            {/if}
          </div>

          <!-- Receipts -->
          <div>
            <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-3);margin-bottom:6px">
              Payment Receipts {receipts.length > 0 ? `(${receipts.length})` : ''}
            </div>
            {#if receipts.length === 0}
              <span style="font-size:13px;color:var(--ink-3)">No receipts yet</span>
            {:else}
              <div style="display:flex;flex-direction:column;gap:7px">
                {#each receipts as r}
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--surface-2);border-radius:var(--r-lg);border:1px solid var(--border)">
                    <div style="display:flex;align-items:center;gap:8px;min-width:0">
                      <a href={r.file_url} target="_blank" class="file-pill" style="max-width:260px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:12px;height:12px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {r.description || r.file_name}
                      </a>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                      {#if r.amount}
                        <span style="font-size:13px;font-weight:700;color:var(--green)">{fmt(Number(r.amount))}</span>
                      {/if}
                      <button class="btn btn-danger btn-icon" title="Remove" onclick={() => delReceipt(r.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- ════ BOTTOM — UPLOADS (hidden when all done) ════ -->
      {#if !allUploaded}
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- PDF Upload -->
          {#if showPDFUpload}
            <div class="section-card" style="margin-bottom:0">
              <div class="section-head"><span class="section-title">Upload Agreement PDF</span></div>
              <div class="section-body">
                <label class="upload-zone" style="display:block;cursor:pointer" for="pdfUpload">
                  {#if uploadingPDF}
                    <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--ink-2)">
                      <span class="spin"></span> Uploading…
                    </div>
                  {:else}
                    <div style="font-size:13.5px;color:var(--ink-2);margin-bottom:3px">Upload Agreement PDF</div>
                    <div style="font-size:12px;color:var(--ink-3)">PDF files only</div>
                  {/if}
                </label>
                <input id="pdfUpload" type="file" accept=".pdf" style="display:none" onchange={uploadPDF} />
              </div>
            </div>
          {/if}

          <!-- Receipt Upload -->
          {#if showReceiptUpload}
            <div class="section-card" style="margin-bottom:0">
              <div class="section-head"><span class="section-title">Upload Receipt</span></div>
              <div class="section-body">
                <div style="display:flex;flex-direction:column;gap:12px">
                  <div class="form-group">
                    <label class="form-label" for="recType">Payment Type</label>
                    <select id="recType" class="select" bind:value={recType}>
                      {#each availableTypes as t}
                        <option value={t}>{t}</option>
                      {/each}
                    </select>
                  </div>

                  {#if recType}
                    <div style="padding:9px 13px;background:var(--surface-2);border-radius:var(--r-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                      <span style="font-size:13px;color:var(--ink-2)">Amount</span>
                      <span style="font-size:15px;font-weight:700;color:var(--ink)">{fmt(recAmount)}</span>
                    </div>
                  {/if}

                  <div class="form-group">
                    <label class="form-label" for="recFile">File (image or PDF)</label>
                    <input id="recFile" type="file" accept="image/*,.pdf" class="input" style="padding:7px 10px"
                      onchange={e => { recFile = (e.target as HTMLInputElement).files?.[0] || null; }} />
                  </div>

                  <button class="btn btn-primary" style="width:100%;justify-content:center"
                    onclick={uploadReceipt} disabled={!recFile || !recType || uploadingRec}>
                    {#if uploadingRec}<span class="spin"></span>{/if}
                    {uploadingRec ? 'Uploading…' : 'Upload Receipt'}
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

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

<style>
@media (max-width:860px) {
  div[style*="grid-template-columns:1.5fr"] { grid-template-columns: 1fr !important; }
}
</style>
