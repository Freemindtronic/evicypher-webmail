<script lang="ts">
  import { fade } from 'svelte/transition'
  import { browser } from 'webextension-polyfill-ts'
  import Brand from '$/components/Brand.svelte'
  import IsZeroconfRunning from '$/components/IsZeroconfRunning.svelte'
  import Select from '$/components/Select.svelte'
  import { locale, isLoading, _ } from '$/i18n'
  import locales from '~/locales.json'
  import Menu from './Menu.svelte'
  import Options from './Options.svelte'
  import Phones from './Phones.svelte'

  $: if (!$isLoading) document.documentElement.setAttribute('dir', $_('ltr'))

  let tab = 'phones'

  $: if (tab === 'evifile') {
    window.open(browser.runtime.getURL('./evifile.html'))
    window.close()
  } else if (tab === 'evilabel') {
    window.open(browser.runtime.getURL('./evilabel.html'))
    window.close()
  }
</script>

<h1>
  <Brand />
  {#if !$isLoading}
    <Select bind:value={$locale} options={locales} />
  {/if}
</h1>
{#if !$isLoading}
  <main in:fade={{ duration: 75 }}>
    <IsZeroconfRunning />
    {#if tab === 'phones'}
      <Phones />
    {:else if tab === 'parameters'}
      <Options />
    {/if}
  </main>
  <Menu bind:tab />
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
      padding-inline-start: 1px;
      font-weight: normal;
      font-size: 0.75rem;
      line-height: 1.5;
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
