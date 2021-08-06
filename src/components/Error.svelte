<p><slot /></p>

<style lang="scss">
  @use 'sass:math';

  p {
    padding: math.div(15em, 16);
    background-color: transparentize(#d00, 0.9);
    border: math.div(1em, 16) solid #d00;
  }
</style>
