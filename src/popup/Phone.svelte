<svelte:options immutable />

<script lang="ts">
  import { favoritePhoneId, Phone } from 'phones'
  import type { Writable } from 'svelte/store'
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-i18n'
  import { readable } from 'svelte/store'

  /** The phone to display. */
  export let phone: Writable<Phone>

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
</script>

<p>
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
    {$phone.name} (<span
      title="Last seen {new Date($phone.lastSeen).toString()}"
      >{#if $time < $phone.lastSeen + 120_000}online{:else}offline{/if}</span
    >)
  </span>
  <button class="button" on:click={() => dispatch('delete', $phone)}>
    {$_('delete')}
  </button>
</p>

<style lang="scss">
  p {
    display: flex;
    gap: 0.5rem;
    align-items: center;
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
