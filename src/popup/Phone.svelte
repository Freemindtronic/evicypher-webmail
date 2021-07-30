<script lang="ts">
  import { favoritePhoneId, Phone } from 'phones'
  import type { Writable } from 'svelte/store'
  import { createEventDispatcher, onMount } from 'svelte'
  import { _ } from 'svelte-i18n'
  import { readable } from 'svelte/store'
  import tippy from 'tippy.js'

  /** The phone to display. */
  export let phone: Writable<Phone>

  let status: HTMLElement
  let lastSeen: HTMLElement

  /** A store containing the current time, updated every 30 seconds. */
  const time = readable(Date.now(), (set) => {
    const interval = setInterval(() => {
      set(Date.now())
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })

  const dispatch = createEventDispatcher<{ delete: Phone }>()

  onMount(() => {
    tippy(status, {
      content: lastSeen,
      theme: 'light-border',
    })
  })
</script>

{#if $favoritePhoneId === $phone.id}
  <button class="transparent" on:click={() => ($favoritePhoneId = -1)}>
    ★
  </button>
{:else}
  <button class="transparent" on:click={() => ($favoritePhoneId = $phone.id)}>
    ☆
  </button>
{/if}
<span>
  {$phone.name}
  <span bind:this={status}
    >({#if $time < $phone.lastSeen + 120_000}{$_('online')}{:else}{$_(
        'offline'
      )}{/if})</span
  >
</span>
<button class="button" on:click={() => dispatch('delete', $phone)}>
  {$_('delete')}
</button>

<span bind:this={lastSeen}>
  Last seen {new Date($phone.lastSeen).toString()}
</span>

<style lang="scss">
  :global {
    @import '../assets/tippy';
  }

  .transparent {
    padding: 0 3px 4px;
    color: $primary;
    font-size: 1.5rem;
    line-height: 1;
    border: 0;
    cursor: pointer;

    &:focus {
      border-radius: 50%;
      outline: 0;
      box-shadow: 0 1px 3px $input-color, 0 0 1px 1px $background-color;
    }
  }
</style>
