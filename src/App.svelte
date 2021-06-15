<script>
  import { browser } from 'webextension-polyfill-ts'

  let color = '#fcdcb4'

  function change() {
    browser.storage.local.set({ color })
  }
</script>

<main>
  <h1>Title</h1>
  <p>Background color: <input type="text" bind:value={color} /></p>
  <p><button on:click={change}>Change</button></p>
</main>
