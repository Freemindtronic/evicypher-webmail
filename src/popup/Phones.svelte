<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Button from '$/components/Button.svelte'
  import HR from '$/components/HR.svelte'
  import TextInput from '$/components/TextInput.svelte'
  import { _ } from '$/i18n'
  import { Phone, phones } from '$/phones'
  import { startBackgroundTask, Task } from '$/task'
  import Pairing from './Pairing.svelte'
  import PhoneItem from './Phone.svelte'

  /** Name of the phone to be added. */
  let phoneName = ''

  /** When set to true, an error message is shown. */
  let nameNotAvailable = false

  /** Wether to show the pairing screen. */
  let pairingInProgress = false

  /** Start the interactive process to register a new phone. */
  const addPhone = async () => {
    if ($phones.some((phone) => get(phone).name === phoneName)) {
      nameNotAvailable = true
      return
    }

    // Show the pairing screen and wait for it to load
    pairingInProgress = true
  }

  /** Remove a phone. */
  const removePhone = ({ detail: phone }: CustomEvent<Phone>) => {
    $phones = $phones.filter((p) => get(p).id !== phone.id)
  }

  // Link to refresh icon html element
  let refreshIcon: HTMLElement

  // Function executed on click on refresh button
  function handleRefreshClick() {
    // Start background task
    resetZeroconf()

    // Start animation
    refreshIcon.classList.remove('anim-spin')
    setTimeout(() => {
      refreshIcon.classList.add('anim-spin')
    }, 50)
  }

  /**
   * I don't know much about the animation on JS but it seems that the class
   * that does the animation needs to be in the HTML first. But be don't want
   * the icon to move on mount so we remove the class.
   */
  onMount(() => {
    refreshIcon.classList.remove('anim-spin')
  })

  // Function that reset Zeroconf
  const resetZeroconf = () => {
    void startBackgroundTask(
      Task.ResetZeroconf,
      async function* () {
        yield
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reporter: () => {},
        signal: new AbortController().signal,
      }
    )
  }
</script>

{#if pairingInProgress}
  <Pairing
    on:success={() => {
      phoneName = ''
      pairingInProgress = false
    }}
    on:cancel={() => {
      pairingInProgress = false
    }}
    {phoneName}
  />
{:else}
  <section>
    <div class="title">
      <h2>{$_('phones')}</h2>
      <Button id="refresh" on:click={handleRefreshClick}
        ><i bind:this={refreshIcon} class="fa-solid fa-rotate anim-spin" />
        {$_('refresh')}</Button
      >
    </div>

    {#if $phones.length === 0}
      <p><em>{$_('register-a-phone-with-the-form-below')}</em></p>
    {:else}
      <div class="grid">
        {#each $phones as phone (phone)}
          <PhoneItem {phone} on:delete={removePhone} />
        {/each}
      </div>
    {/if}
  </section>
  <HR />
  <form on:submit|preventDefault={addPhone}>
    <h3><label for="phone-name">{$_('register-a-new-phone')}</label></h3>
    <p>
      <TextInput
        id="phone-name"
        required={true}
        bind:value={phoneName}
        on:input={() => {
          nameNotAvailable = false
        }}>{$_('name')}</TextInput
      >
      <Button>{$_('add')}</Button>
    </p>
    {#if nameNotAvailable}
      <p class="error">{$_('a-phone-with-this-name-is-already-registered')}</p>
    {/if}
  </form>
  <HR />
{/if}

<style lang="scss">
  :global {
    @import '../assets/tippy';
  }

  h2,
  h3 {
    margin-block-end: 0.5rem;
  }

  section > p {
    margin-block-start: 0;
  }

  form {
    > p {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin: 0.5rem 0;

      > :global(input) {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5em;
    align-items: center;
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .anim-spin {
    animation: spin 1s linear 1;
  }

  @keyframes spin {
    100% {
      -webkit-transform: rotate(180deg);
      transform: rotate(180deg);
    }
  }

  .error {
    color: $error;
    font-weight: bold;
  }
</style>
