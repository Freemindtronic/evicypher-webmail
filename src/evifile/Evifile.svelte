<script lang="ts">
  import Dropzone from 'dropzone'
  import { translateError, translateReport } from 'i18n'
  import type { Report } from 'report'
  import { State } from 'report'
  import { onMount } from 'svelte'
  import { ExtensionError } from 'error'
  import { _ } from 'i18n'
  import { startBackgroundTask, Task } from 'task'

  Dropzone.autoDiscover = false

  let encryptForm: HTMLFormElement
  let decryptForm: HTMLFormElement

  let tip: Report | undefined

  let backgroundTask: Promise<void> | undefined

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
      url: '#',
      // Do not upload files
      autoProcessQueue: false,
      addRemoveLinks: true,
      maxFilesize: 1024 * 1024 * 1024 * 1,
    })

    // When files are added, process them all at once
    dropzone.on('addedfiles', async (files: Dropzone.DropzoneFile[]) => {
      // If a task is running, refuse to add files
      if (backgroundTask !== undefined) {
        for (const file of files) {
          dropzone.emit('complete', file)
          dropzone.emit('error', file, $_('one-file-at-a-time'))
        }
        return
      }

      const fileURLs: Array<{ name: string; url: string }> = []
      const map = new Map<string, Dropzone.DropzoneFile>()

      for (const file of files) {
        const url = URL.createObjectURL(file)
        fileURLs.push({ name: file.name, url })
        map.set(url, file)
      }

      try {
        backgroundTask = startBackgroundTask(
          task,
          async function* () {
            yield
            yield fileURLs
          },
          {
            reporter: (report: Report) => {
              // Handle subtask reports for each file
              if (report.state === State.SUBTASK_IN_PROGRESS) {
                dropzone.emit(
                  'uploadprogress',
                  map.get(report.taskId),
                  report.progress * 100
                )
              } else if (report.state === State.SUBTASK_COMPLETE) {
                triggerDownload(report.name, report.url)
                dropzone.emit('success', map.get(report.taskId))
                dropzone.emit('complete', map.get(report.taskId))
              } else if (report.state === State.SUBTASK_FAILED) {
                dropzone.emit(
                  'error',
                  map.get(report.taskId),
                  $translateError(report.message)
                )
                dropzone.emit('complete', map.get(report.taskId))
              } else {
                // Display other reports above the two zones
                tip = report
              }
            },
          }
        )
        await backgroundTask
      } catch (error: unknown) {
        if (!(error instanceof ExtensionError)) throw error
        for (const file of files) {
          dropzone.emit('error', file, $translateError(error.message))
          dropzone.emit('complete', file)
        }
      } finally {
        // Allow a new task to begin
        backgroundTask = undefined
      }
    })
  }

  onMount(() => {
    setupDropzone(encryptForm, Task.ENCRYPT_FILE)
    setupDropzone(decryptForm, Task.DECRYPT_FILE)
  })
</script>

<h1>{$_('evifile')}</h1>

{#if backgroundTask === undefined}
  <p>{$_('drop-a-file-in-one-of-the-two-zones-below')}</p>
{:else}
  {#await backgroundTask}
    <p>
      {#if tip === undefined}
        {$_('loading')}
      {:else}
        {$translateReport(tip)}
      {/if}
    </p>
  {/await}
{/if}

<main>
  <form class="dropzone" bind:this={encryptForm}>
    <h2 class="dz-message">
      <button type="button">{$_('drop-files-here-to-encrypt')}</button>
    </h2>
  </form>

  <form class="dropzone" bind:this={decryptForm}>
    <h2 class="dz-message">
      <button type="button">{$_('drop-files-here-to-decrypt')}</button>
    </h2>
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

  button {
    border: 0;
    outline: 0;
  }
</style>
