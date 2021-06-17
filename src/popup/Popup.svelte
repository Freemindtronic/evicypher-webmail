<script lang="ts">
  import { _, locale, locales } from 'svelte-i18n'
  import BurgerMenu from 'svelte-burger-menu'
  import Router, { link } from 'svelte-spa-router'
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
  <BurgerMenu>
    <ul>
      <li>
        <a href="/" use:link>{$_('home')}</a>
      </li>
      <li>
        <a href="/phones" use:link>{$_('phones')}</a>
      </li>
      <li>
        <a href="/autofill" use:link>{$_('auto-fill')}</a>
      </li>
      <li>
        <a href="/about" use:link>{$_('about')}</a>
      </li>
    </ul>
    <select bind:value={$locale}>
      {#each $locales as locale}
        <option value={locale}>{locale}</option>
      {/each}
    </select>
  </BurgerMenu>
  <Router {routes} />
</main>

<style lang="scss">
  $gap-large: 2em;
  main {
    padding-top: $gap-large;
  }
</style>
