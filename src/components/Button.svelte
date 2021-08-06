<!--
  @component
  A button component.

  **Usage:**
  ```tsx
  <Button type="button">Add to cart</Button>
  ```
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
  // Some rules come from https://csstools.github.io/sanitize.css/
  button {
    // $px is 1/16th of 1em, which is 1px when 1em=16px
    padding: 3 * $px 5 * $px;
    color: $background-color;
    font: inherit;
    letter-spacing: inherit;
    background-color: $input-color;
    border: $px solid $input-color;
    border-radius: 4 * $px;

    &:hover,
    &:focus {
      background-color: scale-color($input-color, $lightness: -10%);
      border-color: scale-color($input-color, $lightness: -30%);
    }

    &:focus {
      outline: 0;
      box-shadow: 0 $px 3 * $px $input-color, 0 0 $px $px $background-color;
    }

    &:active {
      box-shadow: inset 0 2 * $px 4 * $px
        scale-color($input-color, $lightness: -50%);
    }
  }
</style>
