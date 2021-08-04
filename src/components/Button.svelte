<!--
  @component
  A button component.
-->

<button on:click><slot /></button>

<style lang="scss">
  button {
    color: $background-color;
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
