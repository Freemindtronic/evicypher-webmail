<script lang="ts">
  import tippy from 'tippy.js'
  import type { Instance } from 'tippy.js'
  import { createEventDispatcher, onMount } from 'svelte'
  import { browser } from 'webextension-polyfill-ts'
  import { ButtonState } from './encryption'

  export let tooltip: string | undefined = undefined
  export let state: ButtonState = ButtonState.IDLE

  let button: HTMLButtonElement
  let tippyElement: HTMLElement
  let tip: Instance

  const dispatch =
    createEventDispatcher<{ click: undefined; abort: undefined }>()

  $: if (tooltip === undefined) tip?.hide()
  else tip?.show()

  $: tip?.setProps({
    trigger:
      state === ButtonState.IN_PROGRESS ? 'manual' : tippy.defaultProps.trigger,
  })

  onMount(() => {
    tip = tippy(button, {
      content: tippyElement,
      hideOnClick: false,
      theme: 'light-border',
      interactive: true,
      placement: 'bottom-start',
    })
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
