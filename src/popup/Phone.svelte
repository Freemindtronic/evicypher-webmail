<script lang="ts">
  import type { Phone } from 'phones'
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-i18n'

  const dispatch = createEventDispatcher<{ delete: Phone }>()
  export let phone: Phone
</script>

<p>
  {phone}
  <button on:click={() => dispatch('delete', phone)}>{$_('delete')}</button>
</p>
