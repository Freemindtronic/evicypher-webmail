<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
  import { browser } from 'webextension-polyfill-ts'

  let color = '#fcdcb4'

  function change() {
    browser.storage.local.set({ color })
  }
</script>

<main>
  <h1>{$_('phones')}</h1>
  <p>{$_('background-color')} <input type="text" bind:value={color} /></p>
  <p><button on:click={change}>{$_('change')}</button></p>
  <a href="/about/" use:link>{$_('about')}</a>
</main>
