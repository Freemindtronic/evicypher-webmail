<script lang="ts">
  import Button from './Button.svelte'
  import { ButtonState } from './encryption'

  /** Tooltip content. */
  export let tooltip: string | undefined = undefined

  /** Button state. */
  export let state: ButtonState = ButtonState.IDLE
</script>

<Button
  bind:tooltip
  bind:state
  tooltipPlacement="top-end"
  idleIcon="🔒"
  idleTooltip="Click to encrypt this message."
  doneTooltip="Mail encrypted successfully!
  Click to encrypt once again."
  on:click
  on:abort
/>
