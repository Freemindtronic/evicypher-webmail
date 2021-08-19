<script lang="ts">
  import Select from '$/components/Select.svelte'
  import { isLoading, locale, locales, _ } from '$/i18n'

  $: if (!$isLoading) document.documentElement.setAttribute('dir', $_('ltr'))
</script>

{#if !$isLoading}
  <main>
    <h1>{$_('evidns-is-not-properly-installed')}</h1>
    <p>
      <strong>{$_('evidns')}</strong>
      {$_('is-a-software-that-allows')}
    </p>
    <p>
      {$_('evicypher-webmail-cannot-find-evidns')}
      <strong>{$_('restart-your-browser-after-installing-evidns')}</strong>
    </p>
    <p>
      <a href="https://freemindtronic.com/evidns-zeroconf-by-freemindtronic/">
        {$_('download-the-latest-version-of-evidns')}
      </a>
    </p>
  </main>
  <p>
    <Select bind:value={$locale} options={$locales} />
  </p>
{/if}

<style lang="scss">
  :global {
    @import '../assets/sanitize';

    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
  }

  main {
    max-width: 40rem;
    padding: 0 0.9375rem;
    text-align: justify;
    background: $error-background;
    border: 1px solid $error;
  }
</style>
