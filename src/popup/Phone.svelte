<script lang="ts">
  import type { Readable } from 'svelte/store'
  import type { Content } from 'tippy.js'
  import { createEventDispatcher } from 'svelte'
  import { readable } from 'svelte/store'
  import tippy from 'tippy.js'
  import { _ } from 'i18n'
  import { timeago } from 'i18n/timeago'
  import { favoritePhoneId, Phone } from 'phones'

  /** The phone to display. */
  export let phone: Readable<Phone>

  /** A store containing the current time, updated every second. */
  const time = readable(Date.now(), (set) => {
    const interval = setInterval(() => {
      set(Date.now())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  })

  /** A `use:` action that adds a tooltip to an element. */
  const tooltip = (element: HTMLElement, content: Content) => {
    const instance = tippy(element, {
      content,
      theme: 'light-border',
    })

    return {
      update(content: HTMLElement) {
        instance.setContent(content)
      },
      destroy() {
        instance.destroy()
      },
    }
  }

  const dispatch = createEventDispatcher<{ delete: Phone }>()
</script>

{#if $favoritePhoneId === $phone.id}
  <button
    class="transparent"
    on:click={() => {
      $favoritePhoneId = -1
    }}
  >
    ★
  </button>
{:else}
  <button
    class="transparent"
    on:click={() => {
      $favoritePhoneId = $phone.id
    }}
  >
    ☆
  </button>
{/if}
<span>
  {$phone.name}
  <!-- The `$time &&` below is there to trigger a refresh every 30 seconds -->
  <span
    use:tooltip={$_('last-seen-timeago', {
      values: { date: $timeago($phone.lastSeen, $time) },
    })}
    >({#if $time && $phone.isOnline}{$_('online')}{:else}{$_(
        'offline'
      )}{/if})</span
  >
</span>
<button
  class="button"
  on:click={() => {
    dispatch('delete', $phone)
  }}
>
  {$_('delete')}
</button>

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
