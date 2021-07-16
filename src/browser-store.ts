import type { Subscriber, Unsubscriber, Updater, Writable } from 'svelte/store'
import { browser, Storage } from 'webextension-polyfill-ts'

/**
 * A {@link https://svelte.dev/docs#writable | writable store} backed by local storage.
 *
 * @typeParam T - Type of the wrapped variable
 */
export class BrowserStore<T> implements Writable<T> {
  /** A promise resolved when all known BrowserStores are hydrated. */
  static allLoaded: Promise<void> = Promise.resolve()

  /** Storage key. */
  readonly name: string

  /** Underlying store. */
  readonly writable: Writable<T>

  /** A promise resolved when the store is hydrated with the persisted data. */
  readonly loadPromise: Promise<void>

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
      fromJSON = (x: T) => x,
      storage = browser.storage.local,
    }: {
      /**
       * Used to produce an object of type `T` with the output of `JSON.parse`.
       *
       * @remarks
       *   The default transformer is `x => x`: it returns its first argument
       *   directly. Async functions are allowed.
       * @param parsed - The output of `JSON.parse`
       * @returns A value to {@link set | `set`} the store to
       */
      transformer?: (parsed: unknown) => T | PromiseLike<T>

      /** The opposite operation: used to produce a `JSON.stringify`able object. */
      fromJSON?: (x: T) => unknown

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

    // Set to true when `get(this.writable) === storage.get(this.name)`
    let loaded = false
    let ignoreNextEvent = false

    // Asynchronously load data from browser storage
    this.loadPromise = new Promise((resolve) => {
      this.writable.update((value) => {
        void storage
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

    // Make changes persistent
    this.writable.subscribe((value) => {
      if (!loaded) return

      // Do not trigger the event listener below
      ignoreNextEvent = true

      void storage.set({ [this.name]: JSON.stringify(fromJSON(value)) })
    })

    // Make a nice promise chain
    BrowserStore.allLoaded = BrowserStore.allLoaded.then(
      async () => this.loadPromise
    )

    // Listen for changes in other tabs/processes
    browser.storage.onChanged.addListener((changes, storageName) => {
      // Ignore unrelated storages and keys
      if (!sameStorage(storageName, storage) || !(this.name in changes)) return

      // If the change was local, ignore it
      if (ignoreNextEvent) {
        ignoreNextEvent = false
        return
      }

      // Temporarily unload the value to prevent an infinite loop
      loaded = false

      // We need to wrap the output of `transformer` in case it is not asynchronous
      void Promise.resolve(
        transformer(JSON.parse(changes[this.name].newValue))
      ).then((value) => {
        this.writable.set(value)
        loaded = true
      })
    })
  }

  set(value: T): void {
    this.writable.set(value)
  }

  update(updater: Updater<T>): void {
    this.writable.update(updater)
  }

  subscribe(
    run: Subscriber<T>,
    invalidate?: (value?: T) => void
  ): Unsubscriber {
    return this.writable.subscribe(run, invalidate)
  }
}

/** @returns Whether the storage given matches the name given. */
const sameStorage = (storageName: string, storage: Storage.StorageArea) =>
  (storageName === 'sync' && storage === browser.storage.sync) ||
  (storageName === 'local' && storage === browser.storage.local) ||
  (storageName === 'managed' && storage === browser.storage.managed)
