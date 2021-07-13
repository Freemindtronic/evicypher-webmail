/**
 * An observable offers a simple way to `await` changes.
 *
 * ```ts
 * // Number of people connected
 * const connected = new Observable(0)
 *
 * function connect(): void {
 *   connected.set(connected.get() + 1)
 * }
 *
 * async function count(): Promise<never> {
 *   while (true) {
 *     await connected.observe()
 *     const n = connected.get()
 *     console.log(
 *       n === 1 ? '1 person is connected' : `${n} people are connected`
 *     )
 *   }
 * }
 *
 * // Start the async task
 * void count()
 *
 * connect() // 1 person is connected
 * setTimeout(connect, 500) // 2 people are connected
 * ```
 */
export class Observable<T> {
  private value: T
  private readonly resolves: Array<() => void> = []

  /** Initializes the observer with a value. */
  constructor(value: T) {
    this.value = value
  }

  /** Gets the observed value. */
  get(): T {
    return this.value
  }

  /** Sets a new value and triggers observers. */
  set(value: T): void {
    this.value = value
    while (this.resolves.length > 0) this.resolves.pop()?.()
  }

  /**
   * Returns a promise that resolves when the value is updated.
   *
   * @remarks
   *   The promise resolves once per synchronous block. That means that if you
   *   call {@link set} multiple times, the promise will only resolve once. With
   *   the example above:
   *
   *   ```ts
   *   // Start the async task
   *   void count()
   *
   *   connect() // *nothing*
   *   connect() // *nothing*
   *   connect() // 3 people are connected
   *   ```
   *
   *   That is also the reason why the return type is `Promise<void>`: it forces
   *   the developer to {@link get} the most recent value.
   */
  async observe(): Promise<void> {
    let _resolve!: () => void
    const promise = new Promise<void>((resolve) => {
      _resolve = resolve
    })
    this.resolves.push(_resolve)
    return promise
  }
}
