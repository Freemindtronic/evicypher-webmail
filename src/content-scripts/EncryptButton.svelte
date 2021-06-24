<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<button on:click={() => dispatch('click')}>🔐</button>

<style lang="scss">
  button {
    all: revert;
  }
</style>
