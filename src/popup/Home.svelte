<script lang="ts">
  import { favoritePhone } from 'phones'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
</script>

<h1>{$_('home')}</h1>
<ul>
  <li>
    {$_('favorite-phone')}
    {#if $favoritePhone !== undefined}
      {$favoritePhone}
    {:else}
      <a href="/phones" use:link> {$_('none-define-one-here')}</a>
    {/if}
  </li>
  <li>{$_('show-most-recent-post-it')}</li>
  <li>{$_('create-a-key-segment')}</li>
</ul>
