<script lang="ts">
  import { locale, locales } from 'svelte-i18n'
  import Router from 'svelte-spa-router'
  import About from './About.svelte'
  import AutoFill from './AutoFill.svelte'
  import Home from './Home.svelte'
  import Phones from './Phones.svelte'

  const routes = {
    '/': Home,
    '/about': About,
    '/phones': Phones,
    '/autofill': AutoFill,
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
