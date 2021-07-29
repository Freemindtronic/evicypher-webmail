<script lang="ts">
  import Dropzone from 'dropzone'
  import { ExtensionError } from 'error'
  import { translateError, _r } from 'i18n'
  import type { Report } from 'report'
  import { State } from 'report'
  import { onMount } from 'svelte'
  import type { _ } from 'svelte-i18n'
  import { startBackgroundTask, Task } from 'task'

  Dropzone.autoDiscover = false

  let encryptForm: HTMLFormElement
  let decryptForm: HTMLFormElement

  let tip: Report | undefined

  let backgroundTask: Promise<{ name: string; url: string }> | undefined

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
        if (backgroundTask !== undefined) {
          done('One file at a time!')
          return
        }
        try {
          backgroundTask = startBackgroundTask(
            task,
            async function* () {
              yield
              yield { name: file.name, url: URL.createObjectURL(file) }
            },
            {
              reporter: (report: Report) => {
                if (report.state === State.TASK_IN_PROGRESS)
                  dropzone.emit('uploadprogress', file, report.progress * 100)
                tip = report
              },
            }
          )
          let { name, url } = await backgroundTask
          triggerDownload(name, url)
          done()
          dropzone.emit('success', file)
          dropzone.emit('complete', file)
        } catch (error: unknown) {
          console.error(error)
          if (error instanceof ExtensionError)
            done($translateError(error.message))
        } finally {
          backgroundTask = undefined
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

{#if backgroundTask === undefined}
  <p>Drop a file in one of the two zones below.</p>
{:else}
  {#await backgroundTask}
    <p>
      {#if tip === undefined}
        Loading...
      {:else}
        {$_r(tip)}
      {/if}
    </p>
  {/await}
{/if}

<main>
  <form class="dropzone" bind:this={encryptForm}>
    <h2 class="dz-message">
      <button type="button">Drop files here to encrypt</button>
    </h2>
  </form>

  <form class="dropzone" bind:this={decryptForm}>
    <h2 class="dz-message">
      <button type="button">Drop files here to decrypt</button>
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
