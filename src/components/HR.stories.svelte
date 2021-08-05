<script>
  import { Meta, Story, Template } from '@storybook/addon-svelte-csf'
  import HR from './HR.svelte'
</script>

<Meta title="Components/Horizontal Rule" component={HR} />

<Template>
  <p>Text above</p>
  <HR />
  <p>Text below</p>
</Template>

<Story name="Horizontal Rule" />
