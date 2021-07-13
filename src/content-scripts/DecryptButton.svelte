<script lang="ts">
  import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
  import type { Instance } from 'tippy.js'
  import tippy from 'tippy.js'
  import { browser } from 'webextension-polyfill-ts'
  import { ButtonState } from './encryption'

  /** Tooltip content. */
  export let tooltip: string | undefined = undefined

  /** Button state. */
  export let state: ButtonState = ButtonState.IDLE

  let button: HTMLButtonElement
  let tippyElement: HTMLElement
  let tippyInstance: Instance

  const dispatch =
    createEventDispatcher<{ click: undefined; abort: undefined }>()

  // Show the tooltip when it's updated
  $: if (tooltip === undefined) tippyInstance?.hide()
  else tippyInstance?.show()

  // Make the tooltip persistent when the task is running
  $: tippyInstance?.setProps({
    trigger:
      state === ButtonState.IN_PROGRESS ? 'manual' : tippy.defaultProps.trigger,
  })

  onMount(() => {
    tippyInstance = tippy(button, {
      content: tippyElement,
      hideOnClick: false,
      theme: 'light-border',
      interactive: true,
      placement: 'bottom-start',
    })
  })

  afterUpdate(() => {
    // Recompute the location of the tooltip
    tippyInstance?.setContent(tippyElement)
  })
</script>

<span class="wrapper">
  <button on:click={() => dispatch('click')} bind:this={button}>
    {#if state === ButtonState.IDLE}
      🔓
    {:else if state === ButtonState.IN_PROGRESS}
      <img
        src={browser.runtime.getURL('/loading.gif')}
        alt="..."
        width="16"
        height="16"
      />
    {:else if state === ButtonState.DONE}
      ✔
    {:else if state === ButtonState.FAILED}
      ❌
    {/if}
  </button>
</span>

<span bind:this={tippyElement}>
  {#if state === ButtonState.IDLE}
    Click to decrypt this message.
  {:else if state === ButtonState.IN_PROGRESS}
    {tooltip}
    <br />
    <button on:click={() => dispatch('abort')}>Abort</button>
  {:else if state === ButtonState.DONE}
    Click to close the decrypted mail.
  {:else if state === ButtonState.FAILED}
    {tooltip}
    <br />
    Click to retry.
  {/if}
</span>

<style lang="scss">
  :global {
    @import './tooltip';
  }

  button {
    all: revert;
    padding: 0.5em;
  }
</style>
