<script lang="ts">
  import Brand from '$/components/Brand.svelte'
  import { isLoading, _ } from '$/i18n'
  import PasswordGenerator from './PasswordGenerator.svelte'
  import PwnedPassword from './PwnedPassword.svelte'

  /** State of the current component */
  enum State {
    PWNED,
    GENERATOR,
  }

  /** Store current state */
  let state = State.PWNED

  const labelList = [
    { icon: 'fa-user-check', name: 'pwned' },
    { icon: 'fa-key', name: 'generator' },
  ]

  let rowElement: HTMLElement

  const handleClick = (id: string) => () => {
    if (id === 'pwned') state = State.PWNED
    else if (id === 'generator') state = State.GENERATOR
  }

  $: if (!$isLoading) document.documentElement.setAttribute('dir', $_('ltr'))
</script>

<div class="background">
  {#if !$isLoading}
    <div class="box">
      <div class="row header">
        <h1>{'EviPass'}</h1>
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
          {#if state === State.PWNED}
            <PwnedPassword />
          {/if}{#if state === State.GENERATOR}
            <PasswordGenerator />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  :global {
    @import './assets/evipass';
    @import '../assets/tippy.scss';

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
    height: 60%;
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
