<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="public-shell">
  {@render children()}
</div>
