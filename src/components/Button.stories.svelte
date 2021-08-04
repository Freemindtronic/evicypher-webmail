<script>
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
  import Sanitize from './Sanitize.svelte'
  import Button from './Button.svelte'
</script>

<Meta
  title="Button"
  component={Button}
  argTypes={{
    label: { control: { type: 'text' } },
    type: {
      options: ['submit', 'reset', 'button'],
      control: { type: 'inline-radio' },
    },
    onClick: { action: 'clicked' },
  }}
/>

<Template let:args>
  <Sanitize>
    <Button on:click={args.onClick} {...args}>{args.label}</Button>
  </Sanitize>
</Template>

<Story
  name="Primary"
  args={{
    label: 'Button',
  }}
/>
