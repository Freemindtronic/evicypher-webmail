<script lang="ts">
  import { toCanvas } from 'qrcode'

  let canvas: HTMLCanvasElement

  export let scale = 3
  export let size = 21 * scale

  export let data: string | undefined

  $: if (canvas && data) {
    void toCanvas(canvas, data, {
      margin: 0,
      scale,
    })
  } else if (canvas) {
    canvas.width = size
    canvas.height = size
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
  }
</script>

<canvas bind:this={canvas} />
