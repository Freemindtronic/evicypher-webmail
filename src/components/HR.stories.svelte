<script>
  import { Meta, Story, Template } from '@storybook/addon-svelte-csf'
  import HR from './HR.svelte'
  import Sanitize from './Sanitize.svelte'
</script>

<Meta title="Horizontal Rule" component={HR} />

<Template>
  <Sanitize>
    <HR />
  </Sanitize>
</Template>

<Story name="Primary" />
