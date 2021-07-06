<script lang="ts">
  import { toCanvas } from 'qrcode'
  import { createEventDispatcher, onMount } from 'svelte'
  import { backgroundTask, Task } from 'task'

  const dispatch = createEventDispatcher()

  /** Name of the phone to be added. */
  export let phoneName = ''

  let uid: string | undefined

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  const pairingController = new AbortController()

  /** Start the interactive process to register a new phone. */
  onMount(async () => {
    const success = await backgroundTask(Task.PAIR, phoneName, (pairingKey) =>
      toCanvas(qr, pairingKey.toString())
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
