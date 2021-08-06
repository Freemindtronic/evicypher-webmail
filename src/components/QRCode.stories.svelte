<script>
  import { Meta, Story, Template } from '@storybook/addon-svelte-csf'
  import QRCode from './QRCode.svelte'
  import TextInput from './TextInput.svelte'

  let data
  let scale = 4
  let size = scale * 21
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
  <p><QRCode {...args} /></p>
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

<Story name="Reactivity" args={{}} let:args>
  <p>Text above</p>
  <p><QRCode {data} {scale} {size} /></p>
  <p><TextInput bind:value={data}>Data:</TextInput></p>
  <p>
    <label for="scale">Scale:</label>
    <input type="range" id="scale" bind:value={scale} min="1" max="10" />
    {scale}
  </p>
  <p>
    <label for="size">Size:</label>
    <input type="range" id="size" bind:value={size} min="0" max="150" />
    {size}
  </p>
</Story>
