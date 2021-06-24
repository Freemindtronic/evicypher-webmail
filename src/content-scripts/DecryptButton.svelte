<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<button on:click={() => dispatch('click')}>🔓 Decrypt</button>

<style lang="scss">
  button {
    all: revert;
    position: absolute;
    top: 0;
    right: 0;
    padding: 1em 2em;
  }
</style>
