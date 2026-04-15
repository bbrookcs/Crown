<script lang="ts">
  import { goto } from '$app/navigation';
  import { countryCodes } from '$lib/countryCodes';

  let loading = $state(false);
  let errMsg  = $state('');

  /* ── Categories ─────────────────────────── */
  const PRESET_CATS = ['Pre-wedding', 'Wedding', 'Meals'];
  let selectedCats: string[] = $state([]);
  let customCatInput = $state('');
  let showCustomInput = $state(false);
  let customCats: string[] = $state([]);
  let catData: Record<string, { date: string, loc: string }> = $state({
    'Pre-wedding': { date: '', loc: '' },
    'Wedding': { date: '', loc: '' },
    'Meals': { date: '', loc: '' }
  });

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

  /* ── Client info ─────────────────────────── */
  let phones = $state([{ code: '+251', num: '' }]);  // primary + additional
  let groom_name = $state('');
  let bride_name = $state('');

  function addPhone() { phones = [...phones, { code: '+251', num: '' }]; }
  function removePhone(i: number) { phones = phones.filter((_, idx) => idx !== i); }

  /* ── Crew ────────────────────────────────── */
  let crew = $state(['']);
  function addCrew() { crew = [...crew, '']; }
  function removeCrew(i: number) { crew = crew.filter((_, idx) => idx !== i); }

  /* ── Event fields ────────────────────────── */
  let booking_date = $state(new Date().toISOString().slice(0, 10));
  // Default values if NO category is selected
  let fallback_event_date = $state('');
  let fallback_event_loc  = $state('');

  /* ── Payment ─────────────────────────────── */
  let total_price_input = $state('');
  const total_price = $derived(Number(total_price_input.replace(/,/g, '')) || 0);

  function handlePriceInput(e: Event) {
    const val = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    total_price_input = val ? Number(val).toLocaleString('en-US') : '';
  }

  let prepayment_pct = $state(50);
  const prepayment = $derived((total_price * prepayment_pct) / 100);
  const rem = $derived(total_price - prepayment);

  /* ── Notes ───────────────────────────────── */
  let notes = $state('');

  /* ── Files ───────────────────────────────── */
  let pdfFile: File | null     = $state(null);
  let receiptFile: File | null = $state(null);

  /* ── Submit ──────────────────────────────── */
  async function submit() {
    errMsg = '';
    const primaryPhone = phones[0]?.num.trim();
    if (!groom_name.trim() || !bride_name.trim() || !primaryPhone || !booking_date) {
      errMsg = 'Please fill all required client fields and booking date.';
      return;
    }
    if (!total_price_input.trim()) {
      errMsg = 'Total Price is required.';
      return;
    }

    // Determine core event_date and Location
    let evDate = fallback_event_date;
    let evLoc = fallback_event_loc;

    if (selectedCats.length > 0) {
      // Find Primary Date: Wedding takes precedence, otherwise first category
      if (selectedCats.includes('Wedding')) {
        evDate = catData['Wedding'].date;
        evLoc  = catData['Wedding'].loc;
      } else {
        evDate = catData[selectedCats[0]].date;
        evLoc  = catData[selectedCats[0]].loc;
      }
    }

    if (!evDate) {
      errMsg = 'Please select a Wedding Date (or primary event date if no category).';
      return;
    }

    loading = true;

    const phoneStr = phones
      .map(p => p.num.trim() ? `${p.code} ${p.num.trim()}` : '')
      .filter(Boolean)
      .join(', ');

    // Pack category data
    const packedCats = selectedCats.map(c => ({
      name: c,
      date: catData[c].date || null,
      location: catData[c].loc || null
    }));

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groom_name,
        bride_name,
        phone: phoneStr,
        booking_date,
        event_date: evDate,
        event_location: evLoc || null,
        categories: packedCats.length ? JSON.stringify(packedCats) : null,
        status: 'Pending',
        total_price:  total_price,
        prepayment:   prepayment,
        crew: crew.filter(c => c.trim()).length ? JSON.stringify(crew.filter(c => c.trim())) : null,
        notes: notes || null
      })
    });

    if (!res.ok) {
      errMsg = 'Failed to create event. Please try again.';
      loading = false;
      return;
    }

    const { id } = await res.json();

    if (pdfFile) {
      const fd = new FormData();
      fd.append('file', pdfFile); fd.append('event_id', String(id)); fd.append('type', 'agreement');
      await fetch('/api/upload', { method: 'POST', body: fd });
    }

    if (receiptFile) {
      const fd = new FormData();
      fd.append('file', receiptFile); fd.append('event_id', String(id));
      fd.append('type', 'receipt');
      fd.append('amount', String(prepayment));
      fd.append('description', 'Prepayment');
      await fetch('/api/upload', { method: 'POST', body: fd });
    }

    goto(`/admin/events/${id}`);
  }
</script>

<svelte:head><title>New Event — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">New Booking</div>
  <div class="topbar-right">
    <a href="/admin/events" class="btn btn-ghost">
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

    <div class="section-card">
      <div class="section-head">
        <span class="section-title">Booking Details</span>
      </div>
      <div class="section-body">

        <!-- ═══ CATEGORY ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">
          Category
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;align-items:center">
          {#each PRESET_CATS as cat}
            <button
              type="button"
              onclick={() => toggleCat(cat)}
              style="
                display:inline-flex;align-items:center;gap:5px;
                padding:6px 14px;border-radius:var(--r-pill);
                border:1.5px solid {selectedCats.includes(cat) ? 'var(--blue)' : 'var(--border-md)'};
                background:{selectedCats.includes(cat) ? 'var(--blue-tint)' : 'var(--surface)'};
                color:{selectedCats.includes(cat) ? 'var(--blue)' : 'var(--ink-2)'};
                font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;
                transition:all 140ms
              "
            >
              {#if selectedCats.includes(cat)}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>
              {/if}
              {cat}
            </button>
          {/each}

          {#each customCats as cat}
            <button
              type="button"
              onclick={() => toggleCat(cat)}
              style="
                display:inline-flex;align-items:center;gap:5px;
                padding:6px 14px;border-radius:var(--r-pill);
                border:1.5px solid {selectedCats.includes(cat) ? 'var(--blue)' : 'var(--border-md)'};
                background:{selectedCats.includes(cat) ? 'var(--blue-tint)' : 'var(--surface)'};
                color:{selectedCats.includes(cat) ? 'var(--blue)' : 'var(--ink-2)'};
                font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;
                transition:all 140ms
              "
            >
              {#if selectedCats.includes(cat)}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>
              {/if}
              {cat}
              <span
                role="button"
                tabindex="0"
                onclick={e => { e.stopPropagation(); removeCustomCat(cat); }}
                onkeydown={e => e.key === 'Enter' && removeCustomCat(cat)}
                style="margin-left:2px;color:var(--ink-3);cursor:pointer;line-height:1"
              >×</span>
            </button>
          {/each}

          {#if showCustomInput}
            <div style="display:flex;align-items:center;gap:6px">
              <input type="text" class="input" style="width:150px;padding:5px 10px;font-size:13px" placeholder="Category name…" bind:value={customCatInput} onkeydown={e => e.key === 'Enter' && addCustomCat()} autofocus />
              <button type="button" class="btn btn-primary btn-sm" onclick={addCustomCat}>Add</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick={() => { showCustomInput = false; customCatInput = ''; }}>✕</button>
            </div>
          {:else}
            <button
              type="button"
              onclick={() => showCustomInput = true}
              style="
                display:inline-flex;align-items:center;gap:5px;
                padding:6px 12px;border-radius:var(--r-pill);
                border:1.5px dashed var(--border-md);
                background:transparent;color:var(--ink-3);
                font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;
              "
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          {/if}
        </div>

        <hr class="divider" />

        <!-- ═══ CLIENT ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Client</div>
        <div class="form-grid" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label" for="gn">Groom Name *</label>
            <input id="gn" type="text" class="input" placeholder="First & last name" bind:value={groom_name} />
          </div>
          <div class="form-group">
            <label class="form-label" for="bn">Bride Name *</label>
            <input id="bn" type="text" class="input" placeholder="First & last name" bind:value={bride_name} />
          </div>
        </div>

        <div style="margin-bottom:20px">
          <label class="form-label" style="margin-bottom:6px;display:block">Phone *</label>
          <div style="display:flex;flex-direction:column;gap:7px">
            {#each phones as phone, i}
              <div style="display:flex;gap:7px;align-items:center">
                <select class="select" bind:value={phone.code} style="width:115px;flex-shrink:0;padding-right:24px;font-size:13px">
                  {#each countryCodes as c}
                    <!-- MAGIC TRICK: If selected, just show the code. When expanding, we see full name natively handled by innerText matching! Wait, actually standard dropdown just uses what's inside. Let's use logic inside option: -->
                    <option value={c.code}>
                      {#if phone.code === c.code}
                        {c.code}
                      {:else}
                        {c.code} {c.name.split(' ')[0]}
                      {/if}
                    </option>
                  {/each}
                </select>
                <input
                  type="tel"
                  class="input"
                  placeholder={i === 0 ? 'Primary phone *' : 'Additional phone'}
                  bind:value={phone.num}
                />
                {#if i === 0}
                  <button type="button" onclick={addPhone} title="Add another phone" style="flex-shrink:0;width:36px;height:36px;border-radius:var(--r-md);border:1.5px solid var(--border-md);background:var(--surface);color:var(--blue);cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                {:else}
                  <button type="button" onclick={() => removePhone(i)} title="Remove" style="flex-shrink:0;width:36px;height:36px;border-radius:var(--r-md);border:1.5px solid var(--border-md);background:var(--red-tint);color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <hr class="divider" />

        <!-- ═══ EVENT ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Event</div>
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Booking Date *</label>
          <input type="date" class="input" bind:value={booking_date} />
        </div>

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

        <hr class="divider" />

        <!-- ═══ PAYMENT ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Payment</div>
        <div class="form-grid" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label" for="tp">Total Price *</label>
            <input id="tp" type="text" class="input" placeholder="0" required value={total_price_input} oninput={handlePriceInput} />
          </div>
          <div class="form-group">
            <label class="form-label" for="pr">Prepayment</label>
            <select id="pr" class="select" bind:value={prepayment_pct}>
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
            </select>
          </div>
          <div class="form-group col-span-2">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <label class="form-label" style="margin-bottom:0">Amount Breakdown</label>
            </div>
            <div class="input" style="cursor:default;display:flex;align-items:center;gap:12px;padding:9px 13px;background:var(--surface-2)">
              <div style="flex:1">
                <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Prepayment</div>
                <div style="font-size:14px;font-weight:600;color:var(--ink)">{prepayment.toLocaleString('en-US')}</div>
              </div>
              <div style="width:1px;height:30px;background:var(--border-md)"></div>
              <div style="flex:1">
                <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Remaining</div>
                <div style="font-size:14px;font-weight:600;color:{rem > 0 ? 'var(--red)' : 'var(--green)'}">{rem.toLocaleString('en-US')}</div>
              </div>
            </div>
          </div>
        </div>

        <hr class="divider" />
         <!-- ═══ CREW ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Crew</div>
        <div style="margin-bottom:20px">
          <label class="form-label" style="margin-bottom:6px;display:block">Assigned Crew Members</label>
          <div style="display:flex;flex-direction:column;gap:7px">
            {#each crew as c, i}
              <div style="display:flex;gap:7px;align-items:center">
                <input type="text" class="input" placeholder="Crew member name" bind:value={crew[i]} />
                {#if i === 0}
                  <button type="button" onclick={addCrew} title="Add another crew member" style="flex-shrink:0;width:36px;height:36px;border-radius:var(--r-md);border:1.5px solid var(--border-md);background:var(--surface);color:var(--blue);cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                {:else}
                  <button type="button" onclick={() => removeCrew(i)} title="Remove" style="flex-shrink:0;width:36px;height:36px;border-radius:var(--r-md);border:1.5px solid var(--border-md);background:var(--red-tint);color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <hr class="divider" />
        <!-- ═══ NOTES ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">Notes</div>
        <div class="form-group" style="margin-bottom:20px">
          <textarea class="textarea" placeholder="Any additional notes…" bind:value={notes}></textarea>
        </div>

        <hr class="divider" />

        <!-- ═══ FILES (optional) ═══ -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:10px">
          Files
        </div>
        <div class="form-grid">

          <div class="form-group">
            <label class="form-label" for="pdfInput">Agreement PDF</label>
            <label for="pdfInput" class="upload-zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:78px;cursor:pointer">
              {#if pdfFile}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--blue)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style="font-size:12px;color:var(--blue);font-weight:500;text-align:center">{pdfFile.name}</span>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--ink-3)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style="font-size:12.5px;color:var(--ink-2)">Upload PDF</span>
              {/if}
            </label>
            <input id="pdfInput" type="file" accept=".pdf" style="position:absolute;opacity:0;width:0.1px;height:0.1px;z-index:-1;" onchange={e => { pdfFile = (e.target as HTMLInputElement).files?.[0] || null; }} />
          </div>

          <div class="form-group">
            <label class="form-label" for="rcptInput">Prepayment Receipt</label>
            <label for="rcptInput" class="upload-zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:78px;cursor:pointer">
              {#if receiptFile}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--green)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style="font-size:12px;color:var(--green);font-weight:500;text-align:center">{receiptFile.name}</span>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" style="width:20px;height:20px;color:var(--ink-3)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style="font-size:12.5px;color:var(--ink-2)">Upload receipt</span>
              {/if}
            </label>
            <input id="rcptInput" type="file" accept="image/*,.pdf" style="position:absolute;opacity:0;width:0.1px;height:0.1px;z-index:-1;" onchange={e => { receiptFile = (e.target as HTMLInputElement).files?.[0] || null; }} />
          </div>
        </div>

      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px">
      <a href="/admin/events" class="btn btn-secondary">Cancel</a>
      <button class="btn btn-primary" onclick={submit} disabled={loading}>
        {#if loading}<span class="spin"></span>{/if}
        {loading ? 'Creating…' : 'Create Booking'}
      </button>
    </div>

  </div>
</div>
