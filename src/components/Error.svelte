<!--
  @component
  A component that displays an error message.

  **Usage:**
  ```tsx
  <Error>
    Wrong email or password.
    <a href="/rest-password">Click here to reset your password.</a>
  </Error>
  ```

  @remarks
  The content is wrapped in a `<p>` tag.
-->

<p><slot /></p>

<style lang="scss">
  @use 'sass:math';

  $red: #d00;

  p {
    padding: math.div(15em, 16);
    background-color: transparentize($red, 0.9);
    border: math.div(1em, 16) solid $red;
  }
</style>
