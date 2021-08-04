<script>
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
  import Button from './Button.svelte'
</script>

<Meta
  title="Button"
  component={Button}
  argTypes={{ onClick: { action: 'clicked' } }}
/>

<Template let:args>
  <Button on:click={args.onClick}>{args.label}</Button>
</Template>

<Story
  name="Primary"
  args={{
    label: 'Button',
  }}
/>
