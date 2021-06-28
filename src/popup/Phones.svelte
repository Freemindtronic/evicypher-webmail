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
  import { tick } from 'svelte'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
  import PhoneItem from './Phone.svelte'

  /** Name of the phone to be added. */
  let phoneName = ''

  /** Wether to show the pairing screen. */
  let pairingInProgress = false

  let uid: string | undefined

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  let pairingController: AbortController | undefined

  /** Start the interactive process to register a new phone. */
  const addPhone = async () => {
    // Show the pairing screen and wait for it to load
    pairingInProgress = true
    pairingController = new AbortController()
    await tick()

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
    pairingInProgress = false
  }

  /** Remove a phone. */
  const removePhone = ({ detail: phone }: CustomEvent<Phone>) => {
    $phones = $phones.filter((p) => p.id !== phone.id)
  }

  /** Cancel the pairing process. */
  const cancelPairing = () => {
    phoneName = ''
    pairingInProgress = false
    pairingController?.abort()
  }
</script>

<main>
  <h1>{$_('phones')}</h1>
  {#if pairingInProgress}
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
  {:else}
    {#each $phones as phone (phone.id)}
      <PhoneItem {phone} on:delete={removePhone} />
    {/each}
    <form on:submit|preventDefault={addPhone}>
      <h2>{$_('register-a-new-phone')}</h2>
      <p>
        {$_('name')}
        <input type="text" bind:value={phoneName} required />
        <button type="submit">{$_('add')}</button>
      </p>
    </form>
    <a href="/about/" use:link>{$_('about')}</a>
  {/if}
</main>
