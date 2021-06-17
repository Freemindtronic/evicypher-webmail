<script lang="ts">
  import { browser } from 'webextension-polyfill-ts'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'

  let color = '#fcdcb4'

  function change() {
    browser.storage.local.set({ color })
  }
</script>

<main>
  <h1>{$_('title')}</h1>
  <p>{$_('background-color')} <input type="text" bind:value={color} /></p>
  <p><button on:click={change}>{$_('change')}</button></p>
  <a href="/about/" use:link>{$_('about')}</a>
</main>
