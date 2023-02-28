/**
 * See {@link Observable}.
 *
 * @module
 */
/**
 * An observable offers a simple way to `await` changes.
 *
 * ```ts
 * // Number of people connected
 * const connected = new Observable(0)
 *
 * function connect(): void {
 *   connected.update((n) => n + 1)
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
 *
 * @typeParam T - Type of the value held
 */
export class Observable {
    /** Initializes the observer with a value. */
    constructor(value) {
        this.resolvers = [];
        this.subscribers = [];
        this.value = value;
    }
    /** Gets the observed value. */
    get() {
        return this.value;
    }
    /** Sets a new value and triggers observers. */
    set(value) {
        var _a;
        this.value = value;
        while (this.resolvers.length > 0)
            (_a = this.resolvers.pop()) === null || _a === void 0 ? void 0 : _a();
        for (const subscriber of this.subscribers)
            subscriber(value);
    }
    /**
     * Gets and sets, but shorter.
     *
     * ```ts
     * // With get and set:
     * x.set(x.get() + 1)
     * // With update:
     * x.update((n) => n + 1)
     * ```
     *
     * @param f - A function that produces the new value from the old one
     */
    update(f) {
        this.set(f(this.get()));
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
    async observe() {
        let _resolve;
        const promise = new Promise((resolve) => {
            _resolve = resolve;
        });
        this.resolvers.push(_resolve);
        return promise;
    }
    /**
     * Subscribes on value changes.
     *
     * @param subscriber - Subscription callback
     * @returns A function that removes the subscriber
     */
    subscribe(subscriber) {
        subscriber(this.value);
        this.subscribers.push(subscriber);
        return () => {
            this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        };
    }
}
//# sourceMappingURL=observable.js.map