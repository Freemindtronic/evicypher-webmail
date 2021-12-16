<script lang="ts">
  import Logo from '../assets/logo.svg'
</script>

<span class="brand">
  <Logo />
  <strong>EviCypher</strong>
  Webmail
</span>

<style lang="scss">
  .brand {
    display: flex;
    flex: 1;
    gap: 0.5rem;
    align-items: center;
    font-weight: 400;
    font-size: 1.5rem;
    font-family: $title-font;

    > :global(svg) {
      max-height: 1em;
      font-size: 2rem;
      vertical-align: middle;
      fill: $logo-color;
      margin-inline-end: 0.25rem;
    }

    > strong {
      font-weight: 700;
    }
  }
</style>
