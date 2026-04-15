<script lang="ts">
  import '../../app.css';
  import { page, navigating } from '$app/stores';
  import { goto } from '$app/navigation';

  let { children } = $props();
  let Tsdf = $state(true);
  const user = $derived($page.data.user);
  const path = $derived($page.url.pathname as string);
  const isAuth = $derived(path.startsWith('/auth'));

  const nav = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/events',    label: 'Events'    },
    { href: '/admin/users',     label: 'Users'     },
    { href: '/admin/profile',   label: 'Profile'   },
  ];
  const active = (href: string) =>
    href === '/admin/dashboard' ? path === '/admin/dashboard' : path.startsWith(href);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/auth/login');
  }

  function initials(name: string) {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

{#if !isAuth && user}
<div class="shell">

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="sidebar-logo-mark">
        <!-- Crown / film reel mark -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
        </svg>
      </div>
      <div class="sidebar-logo-text">
        <span class="sidebar-logo-name">Crown Films</span>
        <span class="sidebar-logo-sub">Management</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <span class="nav-label">Menu</span>

      <!-- Dashboard -->
      <a href="/admin/dashboard" class="nav-item {active('/admin/dashboard') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        Dashboard
      </a>

      <!-- Events -->
      <a href="/admin/events" class="nav-item {active('/admin/events') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Events
      </a>

      <!-- Restricted Navs (Admin Only) -->
      {#if user?.role === 'admin'}
        <!-- Users -->
        <a href="/admin/users" class="nav-item {active('/admin/users') ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Users
        </a>

        <!-- Analytics -->
        <a href="/admin/analytics" class="nav-item {active('/admin/analytics') ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Analytics
        </a>

        <!-- Intelligence -->
        <a href="/admin/intelligence" class="nav-item {active('/admin/intelligence') ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4M7 5H3"/>
          </svg>
          Intelligence
        </a>
      {/if}

      <!-- Profile -->
      <a href="/admin/profile" class="nav-item {active('/admin/profile') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Profile
      </a>
    </nav>

    <div class="sidebar-bottom">
      <div class="user-row" role="button" tabindex="0"
           onclick={logout}
           onkeydown={e => e.key === 'Enter' && logout()}>
        <div class="avatar">{initials(user?.name || '')}</div>
        <div class="user-row-text">
          <div class="user-row-name">{user?.name}</div>
          <div class="user-row-sub">Sign out</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink-3);flex-shrink:0">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="main">
    {#if $navigating}
      <div class="loading-backdrop">
        <div class="loading-center">
          <div class="loading-ring"></div>
          <div class="loading-icon">
            <!-- Film / video camera icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          </div>
        </div>
      </div>
    {/if}
    {@render children()}
  </div>
</div>

<style>
  .loading-backdrop {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(1px);
    pointer-events: all;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-center {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
  }

  /* Outer spinning ring */
  .loading-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: var(--blue);
    border-right-color: var(--blue);
    animation: ring-spin 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Pulsing halo behind the ring */
  .loading-ring::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1px solid var(--blue);
    opacity: 0.2;
    animation: halo-pulse 1.4s ease-in-out infinite;
  }

  /* Inner icon box */
  .loading-icon {
    width: 44px;
    height: 44px;
    background: var(--surface);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    animation: icon-bounce 1.4s ease-in-out infinite;
  }

  .loading-icon svg {
    width: 22px;
    height: 22px;
    color: var(--blue);
  }

  @keyframes ring-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes halo-pulse {
    0%, 100% { transform: scale(1);   opacity: 0.15; }
    50%       { transform: scale(1.1); opacity: 0.3;  }
  }

  @keyframes icon-bounce {
    0%, 100% { transform: scale(1);    }
    50%       { transform: scale(1.06); }
  }

  @keyframes top-bar-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>

{:else}
  {@render children()}
{/if}
