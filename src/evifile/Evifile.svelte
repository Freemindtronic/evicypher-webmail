<script lang="ts">
  import Dropzone from 'dropzone'
  import { onMount } from 'svelte'
  Dropzone.autoDiscover = false

  let form: HTMLFormElement

  onMount(() => {
    let dropzone = new Dropzone(form, {
      url: 'none',
      autoProcessQueue: false,
      addRemoveLinks: true,
      accept: function (file, done) {
        // https://stackoverflow.com/questions/33710825/getting-file-contents-when-using-dropzonejs
        var reader = new FileReader()
        reader.addEventListener('loadend', function (event) {
          if (!event.target) {
            dropzone.emit('error', file)
            return
          }
          console.log(event.target.result)
          done()
          dropzone.emit('success', file)
          dropzone.emit('complete', file)
        })
        reader.readAsText(file)
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
