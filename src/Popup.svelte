<script lang="ts">
  import Router from 'svelte-spa-router'
  import About from './About.svelte'
  import BackgroundColor from './BackgroundColor.svelte'
  import { locale, locales } from 'svelte-i18n'

  const routes = {
    '/': BackgroundColor,
    '/about/': About,
  }
</script>

<main>
  <Router {routes} />
  <select bind:value={$locale}>
    {#each $locales as locale}
      <option value={locale}>{locale}</option>
    {/each}
  </select>
</main>
