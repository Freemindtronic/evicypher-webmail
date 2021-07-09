<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let tooltip = ''

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<span class="wrapper">
  <button on:click={() => dispatch('click')}>🔐</button>
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
  }

  .wrapper {
    position: relative;
  }

  .tooltip {
    $bg: rgba(0, 0, 0, 0.8);

    position: absolute;
    right: 0;
    bottom: 1.67em;
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
      right: 11px;
      bottom: -10px;
      border: 5px solid transparent;
      border-top-color: $bg;
      content: '';
    }
  }
</style>
