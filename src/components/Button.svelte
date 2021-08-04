<!--
  @component
  A button component.
-->
<script lang="ts">
  /**
   * Defines the behavior of the button.
   *
   * @default 'submit'
   */
  export let type: 'submit' | 'reset' | 'button' = 'submit'
</script>

<button {type} on:click><slot /></button>

<style lang="scss">
  button {
    padding: 0.25em 0.375em;
    color: $background-color;
    font: inherit;
    letter-spacing: inherit;
    background-color: $input-color;
    border: 1px solid $input-color;
    border-radius: 4px;

    &:hover,
    &:focus {
      background-color: scale-color($input-color, $lightness: -10%);
      border-color: scale-color($input-color, $lightness: -30%);
    }

    &:focus {
      outline: 0;
      box-shadow: 0 1px 3px $input-color, 0 0 1px 1px $background-color;
    }

    &:active {
      box-shadow: inset 0 2px 4px scale-color($input-color, $lightness: -50%);
    }
  }
</style>
