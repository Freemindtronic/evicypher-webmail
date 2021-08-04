<!--
  @component
  Apply `sanitize.css` on its children.
-->

<slot />

<style lang="scss">
  :global {
    @import '../assets/sanitize';
  }
</style>
