<script lang="ts">
  import { fade } from 'svelte/transition'
  import { locale, locales, isLoading } from 'i18n'
  import Logo from '../assets/logo.svg'
  import Phones from './Phones.svelte'
</script>

<h1>
  <Logo />
  {#if !$isLoading}
    <select class="input" bind:value={$locale} in:fade={{ duration: 75 }}>
      {#each $locales as locale}
        <option value={locale}>{locale}</option>
      {/each}
    </select>
  {/if}
</h1>
{#if !$isLoading}
  <main in:fade={{ duration: 75 }}>
    <Phones />
  </main>
{/if}

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
