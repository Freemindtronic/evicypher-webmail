<!--
  @component
  A reactive QR code.

  **Usage:**
  ```tsx
  <QRCode data="Hello World!" scale={5}>
  ```
-->
<script lang="ts">
  import { toCanvas } from 'qrcode'

  /**
   * Content of the QR code. If data is `''` or `undefined`, the canvas is made
   * completely transparent, as a square of size `size`.
   *
   * @default undefined
   */
  export let data: string | undefined

  /**
   * Scale of the QR: 1 QR code dot is drawn as (scale) pixels.
   *
   * @default 3
   */
  export let scale = 3

  /**
   * Size (in pixels) of the QR code if no data is provided.
   *
   * @default 21 * scale
   */
  export let size = 21 * scale

  /** Draws a QR code on `canvas`. All parameters are reactive. */
  const qr = (
    canvas: HTMLCanvasElement,
    {
      data,
      scale,
      size,
    }: { data: string | undefined; scale: number; size: number }
  ) => {
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

    return {
      // Whenever the QR code changes, redraw it
      update(args: { data: string | undefined; scale: number; size: number }) {
        qr(canvas, args)
      },
    }
  }
</script>

<canvas use:qr={{ data, scale, size }} />
