<svelte:options immutable />

<script lang="ts">
  import { favoritePhoneId, Phone } from 'phones'
  import type { Writable } from 'svelte/store'
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-i18n'
  import { readable } from 'svelte/store'

  const dispatch = createEventDispatcher<{ delete: Phone }>()
  export let phone: Writable<Phone>

  export const time = readable(Date.now(), (set) => {
    const interval = setInterval(() => {
      set(Date.now())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  })
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
    <!-- {phone} ({#if Date.now() < phone.lastSeen + 60_000}online{:else}offline{/if}) -->
    {$phone.name} ({(($time - $phone.lastSeen) / 1000) | 0})
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
    padding: 0 0 4px;
    color: $primary;
    font-size: 1.5rem;
    line-height: 1;
    border: 0;
  }
</style>
