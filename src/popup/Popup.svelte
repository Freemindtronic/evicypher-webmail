<script lang="ts">
  import { locale, locales } from 'i18n'
  import Logo from '../assets/logo.svg'
  import Phones from './Phones.svelte'
</script>

<h1>
  <Logo />
  <select class="input" bind:value={$locale}>
    {#each $locales as locale}
      <option value={locale}>{locale}</option>
    {/each}
  </select>
</h1>
<main>
  <Phones />
</main>

<style lang="scss">
  :global {
    @import './popup.scss';
  }

  h1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 0.5rem 1rem;
    font-size: 2rem;
    line-height: 1;

    > :global(svg) {
      max-height: 1em;
      vertical-align: bottom;
    }

    select {
      font-weight: normal;
      font-size: 1rem;
    }
  }

  main {
    flex: 1;
    padding: 0 1rem;
    color: $text-color;
    background-color: $background-color;
    border-bottom: 8px solid $dark;
  }
</style>
