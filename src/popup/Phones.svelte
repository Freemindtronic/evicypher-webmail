<script lang="ts">
  import { Phone, phones } from 'phones'
  import { _ } from 'svelte-i18n'
  import { get } from 'svelte/store'
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
    $phones = $phones.filter((p) => get(p).id !== phone.id)
  }
</script>

{#if pairingInProgress}
  <Pairing
    on:success={() => ((phoneName = ''), (pairingInProgress = false))}
    on:cancel={() => (pairingInProgress = false)}
    {phoneName}
  />
{:else}
  <section>
    <h2>{$_('phones')}</h2>
    {#if $phones.length === 0}
      <p><em>{$_('register-a-phone-with-the-form-below')}</em></p>
    {/if}
    {#each $phones as phone (phone)}
      <PhoneItem {phone} on:delete={removePhone} />
    {/each}
  </section>
  <hr />
  <form on:submit|preventDefault={addPhone}>
    <h3><label for="phone-name">{$_('register-a-new-phone')}</label></h3>
    <p>
      <label for="phone-name">{$_('name')}</label>
      <input
        type="text"
        id="phone-name"
        class="input"
        bind:value={phoneName}
        required
      />
      <button type="submit" class="button">{$_('add')}</button>
    </p>
  </form>
{/if}

<style lang="scss">
  h2,
  h3 {
    margin-bottom: 0.5rem;
  }

  section > p {
    margin-top: 0;
  }

  form {
    > p {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0;

      > input {
        flex: 1;
        min-width: 0;
      }
    }
  }
</style>
