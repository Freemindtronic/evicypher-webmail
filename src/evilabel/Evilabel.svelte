<script lang="ts">
  import { onMount } from 'svelte';
  import tippy from 'tippy.js';
  import Brand from '$/components/Brand.svelte'
  import { isLoading, _ } from '$/i18n'
  import Cloud from './Cloud.svelte'
  import Login from './Login.svelte'


  enum State {
    Login, Cloud
  }

  let state = State.Login


  const labelList = [{icon: 'fa-right-to-bracket', name: 'login'}, {icon: 'fa-cloud', name: 'cloud'}]

  let rowElement: HTMLElement
  let isMounted = false
  let isTippySet = false

  // Set tippy content for each element of the menu
  onMount(() => {
    if ($isLoading) return
    setTippy()
    isMounted = true
  })

  function setTippy() {
    for (const item of labelList) {
      const element = rowElement.querySelector('.' + item.name)
      if (element === null) continue
      tippy(element, {
        content: $_(item.name),
      })
    }

    isTippySet = true
  }

  function updateTippy() {
    for (const item of labelList) {
      const element = rowElement.querySelector('.' + item.name)
      if (element === null) continue

      // If tippy already assign to element it possess a `._tippy` property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(element as any)._tippy?.setContent($_(item.name))
    }
  }

  function handleClick(id: string) {
    return () => {
      if (id === 'login') state = State.Login
      else if (id === 'cloud') state = State.Cloud
    }
  }

  // Update the tippy content on language change
  $: if (isTippySet) updateTippy()

  $: if (isMounted && !isTippySet && !$isLoading) setTippy()

  $: if (!$isLoading) document.documentElement.setAttribute('dir', $_('ltr'))
</script>

<div class="background">
  {#if !$isLoading}
    <div class="box">
      <div class="row header">
        <h1>{$_('get-a-label')}</h1>
        <Brand />
      </div>
      <div class="row content">
        <div bind:this={rowElement} class="menu">
          {#each labelList as label}
            <span class="icon {label.name}" on:click={handleClick(label.name)}
              ><i class="fa-solid {label.icon}" /></span
            >
          {/each}
        </div>
        <div class="label content">
          {#if state === State.Cloud}
            <Cloud />
          {:else if state === State.Login}
            <Login />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  :global {
    @import './assets/evilabel';
    @import '../assets/tippy';

    html {
      height: 100%;
    }

    body {
      height: 100%;
      margin: 0;
    }

    p {
      margin: 0;
    }
  }

  .background {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: $dark;
  }

  .box {
    position: relative;
    display: flex;
    flex-flow: column;
    width: $box-width;
    height: $box-height;
    background-color: $background-color;
    border: 2px solid $background-color;
  }

  .box .row.header {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    color: $background-color;
    text-align: center;
    background-color: $dark;

    > :global(span) {
      justify-content: flex-end;
    }
  }

  .box .row.content {
    display: flex;
    flex: 1 1 auto;

    > .label.content {
      flex-grow: 1;
      text-align: center;
    }
  }

  h1 {
    margin: 0;
  }

  .menu {
    display: flex;
    flex-direction: column;
    color: $background-color;
    background-color: $dark;
    border-top: 1px solid;
  }

  span:hover {
    color: $light-gold;
    cursor: pointer;
  }

  .icon {
    padding: 1rem;
    border-bottom: 1px solid $white;
  }
</style>
