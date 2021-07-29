<script lang="ts">
  import { reporter } from 'content-scripts/encryption'

  import Dropzone from 'dropzone'
  import { ExtensionError } from 'error'
  import { translateError } from 'i18n'
  import type { Report } from 'report'
  import { State } from 'report'
  import { onMount } from 'svelte'
  import type { _ } from 'svelte-i18n'
  import { startBackgroundTask, Task } from 'task'

  Dropzone.autoDiscover = false

  let encryptForm: HTMLFormElement
  let decryptForm: HTMLFormElement

  let tip = 'Drop a file in one of the two zones below.'

  /** Prompts the user to save the file located at `url`. */
  const triggerDownload = (name: string, url: string) => {
    const link = document.createElement('a')
    link.download = name
    link.href = url
    link.click()
  }

  const setupDropzone = (
    parent: HTMLElement,
    task: Task.ENCRYPT_FILE | Task.DECRYPT_FILE
  ) => {
    let dropzone = new Dropzone(parent, {
      url: 'none',
      autoProcessQueue: false,
      addRemoveLinks: true,
      maxFilesize: 1024 * 1024 * 1024 * 1,
      async accept(file, done) {
        try {
          let { name, url } = await startBackgroundTask(
            task,
            async function* () {
              yield
              yield { name: file.name, url: URL.createObjectURL(file) }
            },
            {
              reporter: (report: Report) => {
                if (report.state === State.TASK_IN_PROGRESS)
                  dropzone.emit('uploadprogress', file, report.progress * 100)
                reporter((str) => (tip = str))(report)
              },
            }
          )
          triggerDownload(name, url)
          done()
          dropzone.emit('success', file)
          dropzone.emit('complete', file)
          tip = 'Drop a file in one of the two zones below.'
        } catch (error: unknown) {
          console.error(error)
          if (error instanceof ExtensionError)
            tip = $translateError(error.message)
        }
      },
    })
  }

  onMount(() => {
    setupDropzone(encryptForm, Task.ENCRYPT_FILE)
    setupDropzone(decryptForm, Task.DECRYPT_FILE)
  })
</script>

<h1>EviFile</h1>

<p>{tip}</p>

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

  p {
    margin-bottom: 0;
    padding: 1em;
    text-align: center;
  }
</style>
