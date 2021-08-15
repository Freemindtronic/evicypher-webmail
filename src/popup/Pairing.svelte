<script lang="ts">
  import type { pair as pairTask } from '$/background/tasks/pair'
  import type { Report } from '$/report'
  import type { ForegroundTask } from '$/task'
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import Button from '$/components/Button.svelte'
  import QRCode from '$/components/QRCode.svelte'
  import { _ } from '$/i18n'
  import { State } from '$/report'
  import { startBackgroundTask, Task } from '$/task'

  /** Name of the phone to be added. */
  export let phoneName = ''

  /** A canvas to draw the QR code. */
  let qr: string | undefined

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
    qr = yield

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
      // TODO: handle errors
    }
  })
</script>

<h2>
  {$_('pairing-with-phonename', { values: { phoneName } })}
  <Button
    type="button"
    on:click={() => {
      cancelPairing()
    }}>{$_('cancel')}</Button
  >
</h2>
<p class="center">
  <QRCode data={qr} size={147} />
</p>
<p>
  {#if uid === undefined}
    {tip}
  {:else}
    {$_('is-the-code-uid-correct', { values: { uid: uid.toUpperCase() } })}
    <Button
      type="button"
      on:click={() => {
        $confirmed = true
      }}
    >
      {$_('yes')}
    </Button>
    <Button
      type="button"
      on:click={() => {
        cancelPairing()
      }}>{$_('no')}</Button
    >
  {/if}
  <br />
</p>

<style lang="scss">
  :global(canvas) {
    cursor: text;
  }

  h2 {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > :global(button) {
      flex-shrink: 0;
      font-weight: normal;
      font-size: 1rem;
    }
  }

  .center {
    text-align: center;
  }
</style>
