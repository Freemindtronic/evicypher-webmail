<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let tooltip = ''

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<span class="wrapper">
  <button on:click={() => dispatch('click')}>🔓 Decrypt</button>
  <span>
    <span class="tooltip">{tooltip}</span>
  </span>
</span>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  button {
    all: revert;
    padding: 1em 2em;
  }

  .wrapper {
    position: absolute;
    top: 0;
    right: 0;
  }

  .tooltip {
    $bg: rgba(0, 0, 0, 0.8);

    position: absolute;
    top: 3em;
    right: 0;
    z-index: 1;
    min-width: 200px;
    max-width: 30em;
    padding: 0.25em;
    color: #fff;
    font-size: 1.125rem;
    white-space: normal;
    background-color: $bg;
    border-radius: 4px;

    &:empty {
      display: none;
    }

    &::after {
      position: absolute;
      top: -10px;
      right: 3em;
      border: 5px solid transparent;
      border-bottom-color: $bg;
      content: '';
    }
  }
</style>
