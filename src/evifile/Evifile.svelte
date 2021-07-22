<script lang="ts">
  import Dropzone from 'dropzone'
  import { onMount } from 'svelte'
  import { startBackgroundTask, Task } from 'task'
  import { browser } from 'webextension-polyfill-ts'
  Dropzone.autoDiscover = false

  let form: HTMLFormElement

  onMount(() => {
    let dropzone = new Dropzone(form, {
      url: 'none',
      autoProcessQueue: false,
      addRemoveLinks: true,
      maxFilesize: 1024 * 1024 * 1024 * 1,
      accept: async function (file, done) {
        let { name, url } = await startBackgroundTask(
          Task.ENCRYPT_FILE,
          async function* () {
            yield
            yield { name: file.name, url: URL.createObjectURL(file) }
          }
        )
        window.location.href = url
        done()
        dropzone.emit('success', file)
        dropzone.emit('complete', file)
      },
    })
  })
</script>

<h1>Hello World!</h1>

<form class="dropzone" bind:this={form}>
  <h2 class="dz-message">Drop files here to decrypt</h2>
</form>

<style lang="scss">
  :global {
    @import './assets/dropzone';
  }
</style>
