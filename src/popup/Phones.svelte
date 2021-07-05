<script lang="ts">
  import { Phone, phones } from 'phones'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
  import Pairing from './Pairing.svelte'
  import PhoneItem from './Phone.svelte'

  /** Name of the phone to be added. */
  let phoneName = ''

  /** Wether to show the pairing screen. */
  let pairingInProgress = false

  /** Start the interactive process to register a new phone. */
  const addPhone = async () => {
    // Show the pairing screen and wait for it to load
    pairingInProgress = true
  }

  /** Remove a phone. */
  const removePhone = ({ detail: phone }: CustomEvent<Phone>) => {
    $phones = $phones.filter((p) => p.id !== phone.id)
  }
</script>

<main>
  <h1>{$_('phones')}</h1>
  {#if pairingInProgress}
    <Pairing
      on:success={() => (pairingInProgress = false)}
      on:cancel={() => (pairingInProgress = false)}
      bind:phoneName
    />
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
