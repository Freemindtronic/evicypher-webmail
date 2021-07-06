<script lang="ts">
  import { toCanvas } from 'qrcode'
  import { createEventDispatcher, onMount } from 'svelte'
  import { runBackgroundTask, Task } from 'task'

  const dispatch = createEventDispatcher()

  /** Name of the phone to be added. */
  export let phoneName = ''

  let uid: string | undefined

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  const pairingController = new AbortController()

  /** Interacts with the background script to pair a new device. */
  async function* pair(): AsyncGenerator<void | boolean, boolean, string> {
    // Display the QR code generated
    const key = yield
    toCanvas(qr, key)

    // Display the UID of the device that scanned the QR code
    uid = yield

    // Yield true if the user confirmed pairing
    yield true

    // The pairing completed successfully
    // TODO this value should be ignored, replaced by the return value of the background task
    return true
  }

  /** Start the interactive process to register a new phone. */
  onMount(async () => {
    const success = await runBackgroundTask(Task.PAIR, phoneName, pair())

    if (success) console.log('Pairing successful')

    phoneName = ''

    dispatch('success')
  })

  /** Cancel the pairing process. */
  const cancelPairing = () => {
    phoneName = ''
    pairingController.abort()
    dispatch('cancel')
  }
</script>

<p>
  <button on:click={() => cancelPairing()}>X</button>
</p>
<p>
  <canvas bind:this={qr} />
</p>
<p>
  {#if uid !== undefined}
    Pairing with phone {uid} in progress...
  {:else}
    Please scan this QR code with the application Freemindtronic.
  {/if}
</p>
