<script lang="ts">
  import { favoritePhoneId, phones } from 'phones'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
  import { derived } from 'svelte/store'

  // The favorite phone is a read-only store derived from two writable stores,
  // it updates whenever one of the two updates
  let favoritePhone = derived(
    [phones, favoritePhoneId],
    ([$phones, $favoritePhoneId]) =>
      $phones.find((phone) => phone.id == $favoritePhoneId)
  )
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
