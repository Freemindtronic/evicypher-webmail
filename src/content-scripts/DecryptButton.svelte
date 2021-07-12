<script lang="ts">
  import tippy from 'tippy.js'
  import type { Instance } from 'tippy.js'
  import { createEventDispatcher, onMount } from 'svelte'

  export let tooltip: string | undefined = undefined

  let button: HTMLButtonElement
  let tippyElement: HTMLElement
  let tip: Instance

  const dispatch = createEventDispatcher<{ click: undefined }>()

  const onclick = () => {
    tip.show()
    tip.setProps({ trigger: 'manual' })
    dispatch('click')
  }

  $: {
    if (tooltip === undefined) {
      tip?.hide()
      tip?.setProps({ trigger: tippy.defaultProps.trigger })
    }
  }

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
  <button on:click={onclick} bind:this={button}>🔓 Decrypt</button>
</span>

<span bind:this={tippyElement}
  >{tooltip ?? 'Click to decrypt this message'}</span
>

<style lang="scss">
  :global {
    @import './tooltip';
  }

  button {
    all: revert;
    padding: 0.5em 1em;
  }
</style>
