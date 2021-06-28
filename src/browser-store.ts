import type { Subscriber, Unsubscriber, Updater, Writable } from 'svelte/store'
import { browser, Storage } from 'webextension-polyfill-ts'

/**
 * A {@link https://svelte.dev/docs#writable | writable store} backed by local storage.
 *
 * @typeParam T - Type of the wrapped variable
 */
export class BrowserStore<T> implements Writable<T> {
  name: string
  writable: Writable<T>
  loadPromise: Promise<void>

  static allLoaded: Promise<void> = Promise.resolve()

  /**
   * Instanciate a writable store backed by a local storage.
   *
   * @param name - Name of the store, must be unique
   * @param writable - A writable object to wrap
   */
  constructor(
    name: string,
    writable: Writable<T>,
    {
      transformer = (x) => x as T,
      storage = browser.storage.local,
    }: {
      /**
       * Used to produce an object of type `T` with the output of `JSON.parse`.
       *
       * @remarks
       *   The default transformer is `x => x`: it returns its first argument directly.
       * @param parsed - The output of `JSON.parse`
       * @returns A value to {@link set | `set`} the store to
       */
      transformer?: (parsed: unknown) => T

      /**
       * Where to physically store data.
       *
       * @default `browser.storage.local`
       */
      storage?: Storage.StorageArea
    } = {}
  ) {
    this.name = name
    this.writable = writable

    // Asynchronously load data from browser storage
    let loaded = false

    this.writable.subscribe((value) => {
      console.log(value)
      if (loaded) storage.set({ [this.name]: JSON.stringify(value) })
    })

    this.loadPromise = new Promise((resolve) => {
      this.writable.update((value) => {
        storage
          .get({ [this.name]: JSON.stringify(value) })
          .then(({ [this.name]: value }) => transformer(JSON.parse(value)))
          .then((value) => {
            this.writable.set(value)
            loaded = true
            resolve()
          })
        return value
      })
    })

    const previousPromise = BrowserStore.allLoaded
    BrowserStore.allLoaded = new Promise((resolve) => {
      this.loadPromise.then(() => previousPromise).then(resolve)
    })
  }

  set(value: T): void {
    return this.writable.set(value)
  }

  update(updater: Updater<T>): void {
    return this.writable.update(updater)
  }

  subscribe(
    run: Subscriber<T>,
    invalidate?: (value?: T) => void
  ): Unsubscriber {
    return this.writable.subscribe(run, invalidate)
  }
}
