<script lang="ts">
  import type { Report } from 'report'
  import Dropzone from 'dropzone'
  import { ExtensionError } from 'error'
  import { isLoading, translateError, translateReport, _ } from 'i18n'
  import { State } from 'report'
  import { startBackgroundTask, Task } from 'task'

  Dropzone.autoDiscover = false

  let tip: Report | undefined

  let backgroundTask: Promise<void> | undefined

  /** Prompts the user to save the file located at `url`. */
  const triggerDownload = (name: string, url: string) => {
    const link = document.createElement('a')
    link.download = name
    link.href = url
    link.click()
  }

  /**
   * Handles reports sent by the background task, dispatches events to the right
   * file preview.
   */
  const createReporter =
    (dropzone: Dropzone, map: Map<string, Dropzone.DropzoneFile>) =>
    (report: Report) => {
      // Handle subtask reports for each file
      switch (report.state) {
        case State.SUBTASK_IN_PROGRESS:
          dropzone.emit(
            'uploadprogress',
            map.get(report.taskId),
            report.progress * 100
          )
          break

        case State.SUBTASK_COMPLETE:
          triggerDownload(report.name, report.url)
          dropzone.emit('success', map.get(report.taskId))
          dropzone.emit('complete', map.get(report.taskId))
          break

        case State.SUBTASK_FAILED:
          dropzone.emit(
            'error',
            map.get(report.taskId),
            $translateError(report.message)
          )
          dropzone.emit('complete', map.get(report.taskId))
          break

        default:
          // Display other reports above the two zones
          tip = report
      }
    }

  /** Starts the task given on the files given. */
  const startTask = async (
    task: Task.ENCRYPT_FILE | Task.DECRYPT_FILE,
    dropzone: Dropzone,
    files: Dropzone.DropzoneFile[]
  ) => {
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
          reporter: createReporter(dropzone, map),
        }
      )
      await backgroundTask
    } catch (error: unknown) {
      if (!(error instanceof ExtensionError)) throw error
      for (const file of files) {
        dropzone.emit('error', file, $translateError(error.message))
        dropzone.emit('complete', file)
      }
    }
  }

  /**
   * Creates a new Dropzone in the element given, adds event listener to handle
   * files dropped.
   */
  const dropTask = (
    parent: HTMLElement,
    task: Task.ENCRYPT_FILE | Task.DECRYPT_FILE
  ) => {
    const dropzone = new Dropzone(parent, {
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

      try {
        await startTask(task, dropzone, files)
      } finally {
        // Allow a new task to begin
        backgroundTask = undefined
      }
    })

    return {
      destroy() {
        dropzone.destroy()
      },
    }
  }
</script>

{#if !$isLoading}
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
    <form class="dropzone" use:dropTask={Task.ENCRYPT_FILE}>
      <h2 class="dz-message">
        <button type="button">{$_('drop-files-here-to-encrypt')}</button>
      </h2>
    </form>

    <form class="dropzone" use:dropTask={Task.DECRYPT_FILE}>
      <h2 class="dz-message">
        <button type="button">{$_('drop-files-here-to-decrypt')}</button>
      </h2>
    </form>
  </main>
{/if}

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
    display: flex;
    flex: 1;
    gap: 1em;
    padding: 1em;

    @media (orientation: portrait) {
      flex-direction: column;
    }

    > form {
      flex: 1;
    }
  }

  p {
    margin-block-end: 0;
    padding: 1em;
    text-align: center;
  }

  button {
    border: 0;
    outline: 0;
  }
</style>
