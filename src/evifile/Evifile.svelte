<script lang="ts">
  import Dropzone from 'dropzone'
  import type { Report } from 'report'
  import { State } from 'report'
  import { onMount } from 'svelte'
  import { startBackgroundTask, Task } from 'task'

  Dropzone.autoDiscover = false

  let encryptForm: HTMLFormElement
  let decryptForm: HTMLFormElement

  /** Prompts the user to save the file located at `url`. */
  const triggerDownload = (name: string, url: string) => {
    const link = document.createElement('a')
    link.download = name
    link.href = url
    link.click()
  }

  onMount(() => {
    let encryptDropzone = new Dropzone(encryptForm, {
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
                encryptDropzone.emit(
                  'uploadprogress',
                  file,
                  report.progress * 100
                )
            },
          }
        )
        triggerDownload(name, url)
        done()
        encryptDropzone.emit('success', file)
        encryptDropzone.emit('complete', file)
      },
    })

    let decryptDropzone = new Dropzone(decryptForm, {
      url: 'none',
      autoProcessQueue: false,
      addRemoveLinks: true,
      maxFilesize: 1024 * 1024 * 1024 * 1,
      accept: async function (file, done) {
        let { name, url } = await startBackgroundTask(
          Task.DECRYPT_FILE,
          async function* () {
            yield
            yield { name: file.name, url: URL.createObjectURL(file) }
          },
          {
            reporter: (report: Report) => {
              if (report.state === State.TASK_IN_PROGRESS)
                decryptDropzone.emit(
                  'uploadprogress',
                  file,
                  report.progress * 100
                )
            },
          }
        )
        triggerDownload(name, url)
        done()
        decryptDropzone.emit('success', file)
        decryptDropzone.emit('complete', file)
      },
    })
  })
</script>

<h1>EviFile</h1>

<main>
  <form class="dropzone" bind:this={encryptForm}>
    <h2 class="dz-message">Drop files here to encrypt</h2>
  </form>

  <form class="dropzone" bind:this={decryptForm}>
    <h2 class="dz-message">Drop files here to decrypt</h2>
  </form>
</main>

<style lang="scss">
  :global {
    @import './assets/dropzone';

    body {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  }

  h1 {
    margin: 0;
    padding: 1rem;
    color: $background-color;
    text-align: center;
    background-color: $dark;
  }

  main {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1fr;
    gap: 1em;
    padding: 1em;
    @media (orientation: portrait) {
      grid-template-rows: 1fr 1fr;
      grid-template-columns: auto;
    }
  }
</style>
