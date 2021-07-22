<script lang="ts">
  import Dropzone from 'dropzone'
  import type { Report } from 'report'
  import { State } from 'report'
  import { onMount } from 'svelte'
  import { startBackgroundTask, Task } from 'task'

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
          },
          {
            reporter: (report: Report) => {
              if (report.state === State.TASK_IN_PROGRESS)
                dropzone.emit('uploadprogress', file, report.progress * 100)
            },
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
