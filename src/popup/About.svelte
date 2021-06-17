<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
</script>

<article>
  <h1>{$_('about')}</h1>
  <p>{$_('this-extension-is-developed-by-freemindtronic')}</p>
  <p>{new Date().getFullYear()}</p>
  <a href="/" use:link>{$_('back')}</a>
</article>
