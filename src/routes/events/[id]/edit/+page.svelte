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

  // Categories Setup
  const PRESET_CATS = ['Pre-wedding', 'Wedding', 'Meals'];
  let dbCats = typeof ev.categories === 'string' ? (JSON.parse(ev.categories || '[]') || []) : (ev.categories || []);
  let initialCatData: Record<string, { date: string, loc: string }> = {};
  let initialSelectedCats: string[] = [];
  
  if (Array.isArray(dbCats)) {
    for (const c of dbCats) {
      const name = typeof c === 'string' ? c : c.name;
      initialSelectedCats.push(name);
      initialCatData[name] = {
        date: toDateStr(typeof c === 'string' ? '' : (c.date || '')),
        loc: typeof c === 'string' ? '' : (c.location || '')
      };
    }
  }

  let selectedCats: string[] = $state(initialSelectedCats);
  let customCatInput = $state('');
  let showCustomInput = $state(false);
  let customCats: string[] = $state(initialSelectedCats.filter(c => !PRESET_CATS.includes(c)));
  let catData: Record<string, { date: string, loc: string }> = $state(initialCatData);

  function toggleCat(cat: string) {
    if (selectedCats.includes(cat)) {
      selectedCats = selectedCats.filter(c => c !== cat);
    } else {
      selectedCats = [...selectedCats, cat];
      if (!catData[cat]) catData[cat] = { date: '', loc: '' };
    }
  }

  function addCustomCat() {
    const t = customCatInput.trim();
    if (!t) return;
    if (!customCats.includes(t)) customCats = [...customCats, t];
    if (!selectedCats.includes(t)) {
      selectedCats = [...selectedCats, t];
      catData[t] = { date: '', loc: '' };
    }
    customCatInput = '';
    showCustomInput = false;
  }

  function removeCustomCat(cat: string) {
    customCats = customCats.filter(c => c !== cat);
    selectedCats = selectedCats.filter(c => c !== cat);
  }

  // Default values if NO category is selected
  let fallback_event_date = $state(toDateStr(ev.event_date));
  let fallback_event_loc  = $state(ev.event_location || '');

  let finalEvDate = $state(fallback_event_date);
  let finalEvLoc = $state(fallback_event_loc);
  let packedCats = $state('');

  function prepareSubmit() {
    // Determine core event_date and Location
    finalEvDate = fallback_event_date;
    finalEvLoc = fallback_event_loc;

    if (selectedCats.length > 0) {
      if (selectedCats.includes('Wedding')) {
        finalEvDate = catData['Wedding'].date;
        finalEvLoc  = catData['Wedding'].loc;
      } else {
        finalEvDate = catData[selectedCats[0]].date;
        finalEvLoc  = catData[selectedCats[0]].loc;
      }
    }

    const builtCats = selectedCats.map(c => ({
      name: c,
      date: catData[c].date || null,
      location: catData[c].loc || null
    }));
    packedCats = builtCats.length ? JSON.stringify(builtCats) : '';
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

<div class="page">
  <div style="max-width:720px;margin:0 auto">

    {#if form?.error}
      <div class="alert alert-error" style="margin-bottom:18px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance={() => { loading = true; prepareSubmit(); return async ({ update }) => { loading = false; await update(); }; }}>
      
      <input type="hidden" name="event_date" value={finalEvDate} />
      <input type="hidden" name="event_location" value={finalEvLoc} />
      <input type="hidden" name="categories" value={packedCats} />

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
       <!-- Storage -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Storage Disks</span>
        </div>
        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="sd">File Save Disk</label>
              <input id="sd" name="storage_disk_number" type="text" class="input" placeholder="e.g. C-01" value={ev.storage_disk_number || ''} />
            </div>
            <div class="form-group">
              <label class="form-label" for="bk">Backup Disk</label>
              <input id="bk" name="backup_disk_number" type="text" class="input" placeholder="e.g. C-01" value={ev.backup_disk_number || ''} />
            </div>
          </div>
        </div>
      </div>
      <!-- Categories & Event Details -->
      <div class="section-card">
        <div class="section-head" style="background:#E0E0E8;border-left:3px solid var(--blue)">
          <span class="section-title" style="color:var(--ink)">Event Details</span>
        </div>
        <div class="section-body">
          
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">
            Category <span style="font-weight:400;color:var(--ink-3);text-transform:none;letter-spacing:0">(select all that apply)</span>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;align-items:center">
            {#each PRESET_CATS as cat}
              <button type="button" onclick={() => toggleCat(cat)} style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--r-pill);border:1.5px solid {selectedCats.includes(cat) ? 'var(--blue)' : 'var(--border-md)'};background:{selectedCats.includes(cat) ? 'var(--blue-tint)' : 'var(--surface)'};color:{selectedCats.includes(cat) ? 'var(--blue)' : 'var(--ink-2)'};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 140ms">
                {#if selectedCats.includes(cat)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>{/if}
                {cat}
              </button>
            {/each}

            {#each customCats as cat}
              <button type="button" onclick={() => toggleCat(cat)} style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--r-pill);border:1.5px solid {selectedCats.includes(cat) ? 'var(--blue)' : 'var(--border-md)'};background:{selectedCats.includes(cat) ? 'var(--blue-tint)' : 'var(--surface)'};color:{selectedCats.includes(cat) ? 'var(--blue)' : 'var(--ink-2)'};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 140ms">
                {#if selectedCats.includes(cat)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>{/if}
                {cat}
                <span role="button" tabindex="0" onclick={e => { e.stopPropagation(); removeCustomCat(cat); }} onkeydown={e => e.key === 'Enter' && removeCustomCat(cat)} style="margin-left:2px;color:var(--ink-3);cursor:pointer;line-height:1">×</span>
              </button>
            {/each}

            {#if showCustomInput}
              <div style="display:flex;align-items:center;gap:6px">
                <input type="text" class="input" style="width:150px;padding:5px 10px;font-size:13px" placeholder="Category name…" bind:value={customCatInput} onkeydown={e => e.key === 'Enter' && addCustomCat()} />
                <button type="button" class="btn btn-primary btn-sm" onclick={addCustomCat}>Add</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => { showCustomInput = false; customCatInput = ''; }}>✕</button>
              </div>
            {:else}
              <button type="button" onclick={() => showCustomInput = true} style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:var(--r-pill);border:1.5px dashed var(--border-md);background:transparent;color:var(--ink-3);font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            {/if}
          </div>

          <input type="hidden" name="booking_date" value={toDateStr(ev.booking_date)} />
          <input type="hidden" name="status" value={ev.status} />

          {#if selectedCats.length === 0}
            <div class="form-grid" style="margin-bottom:14px">
              <div class="form-group">
                <label class="form-label">Event Date *</label>
                <input type="date" class="input" bind:value={fallback_event_date} />
              </div>
              <div class="form-group">
                <label class="form-label">Event Location</label>
                <input type="text" class="input" placeholder="Venue..." bind:value={fallback_event_loc} />
              </div>
            </div>
          {:else}
            {#each selectedCats as cat}
              <div class="form-grid" style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px dashed var(--border)">
                <div class="form-group">
                  <label class="form-label">{cat} Date {cat === 'Wedding' || selectedCats.length === 1 ? '*' : ''}</label>
                  <input type="date" class="input" bind:value={catData[cat].date} required={cat === 'Wedding' || selectedCats.length === 1} />
                </div>
                <div class="form-group">
                  <label class="form-label">{cat} Location</label>
                  <input type="text" class="input" placeholder="Venue..." bind:value={catData[cat].loc} />
                </div>
              </div>
            {/each}
          {/if}

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
