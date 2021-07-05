<script lang="ts">
  import { clientHello, PairingKey } from 'legacy-code/device'
  import {
    favoritePhone,
    favoritePhoneId,
    nextPhoneId,
    Phone,
    phones,
  } from 'phones'
  import { toCanvas } from 'qrcode'
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher()

  /** Name of the phone to be added. */
  export let phoneName = ''

  let uid: string | undefined

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  const pairingController = new AbortController()

  /** Start the interactive process to register a new phone. */
  onMount(async () => {
    // Create a new pairing key
    const pairingKey = new PairingKey()

    // Display the pairing QR code
    toCanvas(qr, pairingKey.toString())

    // Wait for the user to scan the code
    const device = await clientHello(pairingKey, pairingController.signal)
    const key = await device.clientKeyExchange()

    // Show the UID
    uid = key.UUID

    // Send the confirmation request
    const certificate = await device.sendNameInfo(phoneName, key.ECC)
    const phone = new Phone(await nextPhoneId(), phoneName, certificate)

    $phones = [...$phones, phone]

    // Show a success message
    console.log('Pairing successful')

    if ($favoritePhone === undefined) {
      $favoritePhoneId = phone.id
    }

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
