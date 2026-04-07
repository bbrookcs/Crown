<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { stats, recent } = $derived(data);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0 }).format(n ?? 0);

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

  const statusClass: Record<string,string> = {
    'Pending':'badge-pending','File Selection':'badge-selection',
    'Editing':'badge-editing','Delivered':'badge-delivered'
  };

  const cards = $derived([
    { label:'Total Events',       value: stats.total,     sub:'All bookings',           color:'rgba(0,113,227,0.08)',   tc:'#0071E3' },
    { label:'Upcoming (30 days)', value: stats.upcoming,  sub:'Wedding events ahead',   color:'rgba(88,86,214,0.08)',   tc:'#5856D6' },
    { label:'In Editing',         value: stats.editing,   sub:'Currently being edited', color:'rgba(255,149,0,0.09)',   tc:'#FF9500' },
    { label:'Delivered',          value: stats.delivered, sub:'Successfully delivered', color:'rgba(52,199,89,0.09)',   tc:'#34C759' },
    { label:'File Selection',   value: stats.selection, sub:'Awaiting client review', color:'rgba(88,86,214,0.08)',   tc:'#5856D6' },
  ]);
</script>

<svelte:head><title>Dashboard — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div>
    <div class="topbar-title">Dashboard</div>
  </div>
  <div class="topbar-right">
    <a href="/admin/events/new" class="btn btn-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New Event
    </a>
  </div>
</div>

<div class="page">

  <!-- Greeting -->
  <div style="margin-bottom:28px">
    <h2 style="font-size:26px;letter-spacing:-0.03em">Good day, {$page.data.user?.name?.split(' ')[0]}.</h2>
    <p style="margin-top:4px;font-size:14px">Here's what's happening with your events.</p>
  </div>

  <!-- Stat grid -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:12px;margin-bottom:24px">
    {#each cards as c}
      <div class="stat-card">
        <div class="stat-icon-wrap" style="background:{c.color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="color:{c.tc}">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <div class="stat-num">{c.value}</div>
        <div class="stat-label">{c.label}</div>
        <div class="stat-sub">{c.sub}</div>
      </div>
    {/each}
  </div>

  <!-- Bottom row -->
  <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:16px">

    <!-- Pipeline -->
    <div class="card">
      <div style="font-size:13px;font-weight:700;letter-spacing:-0.02em;margin-bottom:18px">Pipeline</div>
      {#each [
        {label:'Pending',          v:stats.pending,   c:'#FF9500'},
        {label:'File Selection', v:stats.selection, c:'#5856D6'},
        {label:'Editing',          v:stats.editing,   c:'#FF9500'},
        {label:'Delivered',        v:stats.delivered, c:'#34C759'},
      ] as row}
        <div style="margin-bottom:13px">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
            <span style="color:var(--ink-2)">{row.label}</span>
            <span style="font-weight:600;color:var(--ink)">{row.v}</span>
          </div>
          <div style="height:5px;background:var(--surface-3);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:{stats.total ? (row.v/stats.total)*100 : 0}%;background:{row.c};border-radius:99px;transition:width 0.5s"></div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Recent Events -->
    <div class="table-wrap">
      <div style="padding:14px 18px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;font-weight:700;letter-spacing:-0.02em">Recent Events</span>
        <a href="/admin/events" class="btn btn-ghost btn-sm">View all</a>
      </div>

      {#if recent.length === 0}
        <div class="empty">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h3>No events yet</h3>
          <p>Create your first wedding booking.</p>
          <a href="/admin/events/new" class="btn btn-primary" style="margin-top:14px">New Event</a>
        </div>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Couple</th><th>Wedding Date</th><th>Status</th>
              <th>Total</th><th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {#each recent as ev}
              <tr onclick={() => window.location.href=`/admin/events/${ev.id}`} style="cursor:pointer">
                <td style="font-weight:600">{ev.groom_name} & {ev.bride_name}</td>
                <td style="color:var(--ink-2)">{fmtDate(ev.event_date)}</td>
                <td><span class="badge {statusClass[ev.status]}">{ev.status}</span></td>
                <td style="font-weight:600">{fmt(ev.total_price)}</td>
                <td style="font-weight:600;color:{Number(ev.remaining_amount)>0?'var(--red)':'var(--green)'}">
                  {fmt(ev.remaining_amount)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>
