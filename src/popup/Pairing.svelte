<script lang="ts">
  import type { pair as pairTask } from 'background/tasks/pair'
  import type { Report } from 'report'
  import type { ForegroundTask } from 'task'
  import { toCanvas } from 'qrcode'
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { _ } from 'i18n'
  import { State } from 'report'
  import { startBackgroundTask, Task } from 'task'

  /** Name of the phone to be added. */
  export let phoneName = ''

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  /** Unique identifier, that the user has to approve. */
  let uid: string | undefined

  /** Current state of the pairing process. */
  let tip = $_('loading')

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
    await toCanvas(qr, yield, {
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
    controller.abort()
    dispatch('cancel')
  }

  const reporter = (report: Report) => {
    if (report.state === State.SCANNING) {
      tip =
        report.found === 0
          ? $_('make-sure-your-phone-and-your-computer-are-on-the-same-network')
          : $_('scan-the-qr-code-with-the-application')
    }
  }

  /** Start the pairing process when the component is loaded. */
  onMount(async () => {
    try {
      // Wait for the background task to finish
      await startBackgroundTask(Task.PAIR, pair, {
        reporter,
        signal: controller.signal,
      })

      // The pairing process completed successfully
      dispatch('success')
    } catch (error: unknown) {
      console.error(error)
    }
  })
</script>

<h2>
  {$_('pairing-with-phonename', { values: { phoneName } })}
  <button
    class="button"
    on:click={() => {
      cancelPairing()
    }}>{$_('cancel')}</button
  >
</h2>
<p class="center">
  <canvas bind:this={qr} width="147" height="147" />
</p>
<p>
  {#if uid === undefined}
    {tip}
  {:else}
    {$_('is-the-code-uid-correct', { values: { uid: uid.toUpperCase() } })}
    <button
      class="button"
      type="button"
      on:click={() => {
        $confirmed = true
      }}
    >
      {$_('yes')}
    </button>
    <button
      class="button"
      on:click={() => {
        cancelPairing()
      }}>{$_('no')}</button
    >
  {/if}
  <br />
</p>

<style lang="scss">
  h2 {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > button {
      flex-shrink: 0;
      font-weight: normal;
      font-size: 1rem;
    }
  }

  .center {
    text-align: center;
  }

  canvas {
    cursor: text;
  }
</style>
