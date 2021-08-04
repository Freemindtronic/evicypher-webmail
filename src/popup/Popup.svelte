<script lang="ts">
  import { fade } from 'svelte/transition'
  import { locale, locales, isLoading } from 'i18n'
  import Logo from '../assets/logo.svg'
  import Phones from './Phones.svelte'
</script>

<h1>
  <span class="brand">
    <Logo />
    <strong>EviCypher</strong>
    Webmail
  </span>
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
    padding: 1rem;
    line-height: 1;

    > .brand {
      display: flex;
      flex: 1;
      gap: 0.5rem;
      align-items: center;
      font-weight: 400;
      font-size: 1.5rem;
      font-family: $title-font;

      > :global(svg) {
        max-height: 1em;
        font-size: 2rem;
        vertical-align: middle;
        fill: $logo-color;
        margin-inline-end: 0.25rem;
      }

      > strong {
        font-weight: 700;
      }
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
    border-block-end: 8px solid $dark;
  }
</style>
