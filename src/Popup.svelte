<script lang="ts">
  import { browser } from 'webextension-polyfill-ts'
  import { _, locale, locales } from 'svelte-i18n'

  let color = '#fcdcb4'

  function change() {
    browser.storage.local.set({ color })
  }
</script>

<main>
  <h1>{$_('title')}</h1>
  <p>{$_('background-color')} <input type="text" bind:value={color} /></p>
  <p><button on:click={change}>{$_('change')}</button></p>
  <select bind:value={$locale}>
    {#each $locales as locale}
      <option value={locale}>{locale}</option>
    {/each}
  </select>
</main>
