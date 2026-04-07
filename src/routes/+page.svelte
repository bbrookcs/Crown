<script lang="ts">
</script>

<svelte:head>
  <title>Crown Wedding Films | Coming Soon</title>
</svelte:head>

<div class="coming-soon-container">
  <div class="content">
    <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
    <h1>Crown Wedding Films</h1>
    <p>Coming soon. Stay tuned to capture your most magical moments in cinematic brilliance.</p>
   
  </div>
</div>

<style>
  .coming-soon-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    text-align: center;
    padding: 24px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .content {
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    animation: fadeup 0.8s ease-out;
  }

  .logo {
    width: 64px;
    height: 64px;
    color: #cbd5e1;
  }

  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0;
    line-height: 1.1;
    background: linear-gradient(to right, #ffffff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: 1.25rem;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
  }

  .admin-login-link {
    margin-top: 32px;
    font-size: 0.875rem;
    color: #475569;
    text-decoration: none;
    transition: color 0.2s;
  }

  .admin-login-link:hover {
    color: #94a3b8;
  }

  @keyframes fadeup {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
