<script lang="ts">
  import { toCanvas } from 'qrcode'

  export let scale = 3
  export let size = 21 * scale

  export let data: string | undefined

  const qr = (canvas: HTMLCanvasElement, data: string | undefined) => {
    const update = (data: string | undefined) => {
      if (data) {
        void toCanvas(canvas, data, {
          margin: 0,
          scale,
        })
      } else {
        canvas.width = size
        canvas.height = size
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
      }
    }

    update(data)
    return { update }
  }
</script>

<canvas use:qr={data} />
