<script lang="ts">
  import { onMount } from 'svelte'
  import tippy from 'tippy.js'
  import { _ } from '$/i18n'

  const menu = [
    { class: 'phones', icon: 'fa-mobile-button' },
    { class: 'post-it', icon: 'fa-note-sticky' },
    { class: 'evifile', icon: 'fa-file-alt' },
    { class: 'parameters', icon: 'fa-cog' },
  ]

  export let tab = 'phone'

  let rowElement: HTMLElement
  let isMounted = false

  // Set tippy content for each element of the menu
  onMount(() => {
    for (const item of menu) {
      const element = rowElement.querySelector('.' + item.class)
      if (element === null) continue
      tippy(element, {
        content: $_(item.class),
      })
    }

    isMounted = true
  })

  // Update the tippy content on language change
  $: if (isMounted) {
    for (const item of menu) {
      const element = rowElement.querySelector('.' + item.class)
      if (element === null) continue

      // If tippy already assign to element it possess a `._tippy` property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(element as any)._tippy?.setContent($_(item.class))
    }
  }

  function handleClick(id: string) {
    return () => {
      tab = id
    }
  }
</script>

<div bind:this={rowElement} class="row">
  {#each menu as item}
    <div class="col {item.class}" on:click={handleClick(item.class)}>
      <span class="icon"><i class="fas {item.icon}" /></span>
    </div>
  {/each}
</div>

<style lang="scss">
  :global {
    @import '../assets/tippy';
  }

  * {
    box-sizing: border-box;
  }

  .row {
    margin-bottom: 7px;
  }

  .col {
    float: left;
    width: 25%;
    text-align: center;
    border-right: 1px solid white;
    border-left: 1px solid white;
  }

  .col:hover {
    color: #ffc26e;
    cursor: pointer;
  }
</style>
