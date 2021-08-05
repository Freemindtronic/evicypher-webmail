<script>
  import { Meta, Story, Template } from '@storybook/addon-svelte-csf'
  import QRCode from './QRCode.svelte'
  import TextInput from './TextInput.svelte'
  let data
</script>

<Meta
  title="Components/QR Code"
  component={QRCode}
  argTypes={{
    data: { control: { type: 'text' } },
    size: { control: { type: 'number', min: 1 } },
    scale: { control: { type: 'range', min: 1, max: 10 } },
  }}
/>

<Template let:args>
  <p>Text above</p>
  <QRCode {...args} />
  <p>Text below</p>
</Template>

<Story
  name="Standard usage"
  args={{
    data: 'Hello World!',
    size: 84,
    scale: 4,
  }}
/>

<Story
  name="Empty"
  args={{
    size: 84,
  }}
/>

<Story name="Reactivity" args={{ size: 84, scale: 4 }} let:args>
  <p>Text above</p>
  <QRCode {...args} {data} />
  <p><TextInput bind:value={data}>Data:</TextInput></p>
</Story>
