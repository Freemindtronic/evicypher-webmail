<script lang="ts">
  import { Phone, phones } from 'phones'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
  import PhoneItem from './Phone.svelte'
  import { toCanvas } from 'qrcode'
  import { tick } from 'svelte'
  import { Device } from 'legacy-code/device'

  /** Name of the phone to be added. */
  let phoneName = ''

  /** Wether to show the pairing screen. */
  let pairingInProgress = false

  let uid: string | undefined

  /** A canvas to draw the QR code. */
  let qr: HTMLCanvasElement

  /** Start the interactive process to register a new phone. */
  const addPhone = async () => {
    // Show the pairing screen and wait for it to load
    pairingInProgress = true
    await tick()

    // Create a new pairing key
    const device = new Device()
    const pairingKey = await device.generatePairingKey()

    // Display the pairing QR code
    toCanvas(qr, pairingKey)

    // Wait for the user to scan the code
    await device.clientHello()
    const key = await device.clientKeyExchange()

    // Show the UID
    uid = key.UUID

    // Send the confirmation request
    await device.sendNameInfo(phoneName, key.ECC)

    // Show a success message
    console.log('Pairing successful')
  }

  /** Remove a phone. */
  const removePhone = ({ detail: phone }: CustomEvent<Phone>) => {
    $phones = $phones.filter((p) => p.id !== phone.id)
  }

  /** Cancel the pairing process. */
  const cancelPairing = () => {
    phoneName = ''
    pairingInProgress = false
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
        Paring with phone {uid} in progress...
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
