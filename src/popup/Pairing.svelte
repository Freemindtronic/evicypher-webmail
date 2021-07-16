<script lang="ts">
  import type { pair as pairTask } from 'background/tasks/pair'
  import { toCanvas } from 'qrcode'
  import type { Report } from 'report'
  import { State } from 'report'
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import type { ForegroundTask } from 'task'
  import { startBackgroundTask, Task } from 'task'

  /** Name of the phone to be added. */
  export let phoneName = ''

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  /** Unique identifier, that the user has to approve. */
  let uid: string | undefined

  /** Current state of the pairing process. */
  let tip = 'Loading...'

  /** A writable store updated when the user confirms the UID. */
  const confirmed = writable(false)

  /** Used to abort the pairing process. */
  const controller = new AbortController()

  /** To dispatch events to the parent component. */
  const dispatch = createEventDispatcher<{ success: void; cancel: void }>()

  /**
   * The front end of the pairing process: this function receives the QR code
   * and the UID from the background task, and sends back the confirmation of the user.
   */
  const pair: ForegroundTask<typeof pairTask> = async function* () {
    // Display the QR code generated
    toCanvas(qr, yield, {
      margin: 0,
      scale: 3,
    })

    // Display the UID of the device that scanned the QR code
    uid = yield

    // Yield the name of the phone when the user confirms the UID
    await new Promise<void>((resolve) => {
      // Wait for an update to the $confirmed variable
      confirmed.subscribe((value) => {
        if (value) resolve()
      })
    })
    yield phoneName
  }

  /** Cancel the pairing process. */
  const cancelPairing = () => {
    phoneName = ''
    controller.abort()
    dispatch('cancel')
  }

  const reporter = (report: Report) => {
    if (report.state === State.SCAN_COMPLETE) {
      tip =
        report.found === 0
          ? 'Make sure your phone and your computer are on the same network.'
          : 'Scan the QR code with the application.'
    }
  }

  /** Start the pairing process when the component is loaded. */
  onMount(async () => {
    // Wait for the background task to finish
    const success = await startBackgroundTask(Task.PAIR, pair, {
      reporter,
      signal: controller.signal,
    })

    // The pairing process completed successfully
    if (success) console.log('Pairing successful')

    phoneName = ''

    dispatch('success')
  })
</script>

<h2>
  Pairing with {phoneName}
  <button on:click={() => cancelPairing()}>Cancel</button>
</h2>
<p class="p-canvas">
  <canvas bind:this={qr} />
</p>
<p>
  {#if uid === undefined}
    {tip}
  {:else}
    Is the code {uid} correct?
    <button type="button" on:click={() => ($confirmed = true)}>Yes</button>
    <button on:click={() => cancelPairing()}>No</button>
  {/if}
  <br />
</p>

<style lang="scss">
  h2 {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > button {
      font-weight: normal;
      font-size: 1rem;
    }
  }

  .p-canvas {
    text-align: center;
  }

  canvas {
    cursor: text;
  }
</style>
