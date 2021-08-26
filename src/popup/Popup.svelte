<script lang="ts">
  import { fade } from 'svelte/transition'
  import IsZeroconfRunning from '$/components/IsZeroconfRunning.svelte'
  import Select from '$/components/Select.svelte'
  import { locale, isLoading, _ } from '$/i18n'
  import locales from '~/locales.json'
  import Logo from '../assets/logo.svg'
  import Phones from './Phones.svelte'

  $: if (!$isLoading) document.documentElement.setAttribute('dir', $_('ltr'))
</script>

<h1>
  <span class="brand">
    <Logo />
    <strong>EviCypher</strong>
    Webmail
  </span>
  {#if !$isLoading}
    <Select bind:value={$locale} options={locales} />
  {/if}
</h1>
{#if !$isLoading}
  <main in:fade={{ duration: 75 }}>
    <IsZeroconfRunning />
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

    > :global(select) {
      font-weight: normal;
      font-size: 1rem;
      line-height: 1.5;
    }

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
  }

  main {
    flex: 1;
    padding: 0 1rem;
    color: $text-color;
    background-color: $background-color;
    border-block-end: 8px solid $dark;
  }
</style>
