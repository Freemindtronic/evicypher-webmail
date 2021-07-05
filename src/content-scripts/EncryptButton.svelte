<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let state = ''

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<span class="wrapper">
  <button on:click={() => dispatch('click')}>🔐</button>
  <span>
    <span class="tooltip">{state}</span>
  </span>
</span>

<style lang="scss">
  button {
    all: revert;
  }

  .wrapper {
    position: relative;
  }

  .tooltip {
    position: absolute;
    right: 0;
    bottom: 30px;
    z-index: 1;
    background: rgba(255, 255, 255, 0.5);
  }
</style>
