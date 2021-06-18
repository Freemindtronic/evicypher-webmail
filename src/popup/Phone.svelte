<script lang="ts">
  import { favoritePhoneId, Phone } from 'phones'
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-i18n'

  const dispatch = createEventDispatcher<{ delete: Phone }>()
  export let phone: Phone
</script>

<p>
  {#if $favoritePhoneId == phone.id}
    <button on:click={() => ($favoritePhoneId = -1)}>★</button>
  {:else}
    <button on:click={() => ($favoritePhoneId = phone.id)}>☆</button>
  {/if}
  {phone}
  <button on:click={() => dispatch('delete', phone)}>{$_('delete')}</button>
  <button on:click={() => dispatch('delete', phone)}>{$_('delete')}</button>
</p>
