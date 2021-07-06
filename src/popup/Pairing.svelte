<script lang="ts">
  import { toCanvas } from 'qrcode'
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { runBackgroundTask, Task } from 'task'

  const dispatch = createEventDispatcher()

  const confirm = writable(false)

  /** Name of the phone to be added. */
  export let phoneName = ''

  let uid: string | undefined

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  let state = 'Loading...'

  const pairingController = new AbortController()

  /** Interacts with the background script to pair a new device. */
  async function* pair(): AsyncGenerator<void | boolean, boolean, string> {
    // Display the QR code generated
    const key = yield
    toCanvas(qr, key)

    // Display the UID of the device that scanned the QR code
    uid = yield

    // Yield true if the user confirmed pairing
    await new Promise<void>((resolve) => {
      confirm.subscribe((value) => {
        if (value) resolve()
      })
    })
    yield true
  }

  /** Start the interactive process to register a new phone. */
  onMount(async () => {
    const success = await runBackgroundTask(
      Task.PAIR,
      phoneName,
      pair(),
      (st) => {
        state = st
      }
    )

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
  {state}
</p>
<p>
  <canvas bind:this={qr} />
</p>
<p>
  {#if uid !== undefined}
    Is the code {uid} correct?
    <button type="button" on:click={() => ($confirm = true)}>Yes!</button>
    <button on:click={() => cancelPairing()}>No</button>
  {:else}
    Please scan this QR code with the application Freemindtronic.
  {/if}
</p>
