import type { Subscriber, Unsubscriber, Updater, Writable } from 'svelte/store'
import { browser, Storage } from 'webextension-polyfill-ts'

/** A writable store backed by local storage. */
export class BrowserStore<T> implements Writable<T> {
  name: string
  writable: Writable<T>

  /**
   * Instanciate a writable store backed by a local storage.
   *
   * @param name name of the store, must be unique
   * @param initialValue initial value
   * @param options optional settings, see bellow
   * @param options.transformer used to produce an object of type `T` with the output of JSON.parse (default is `x => x`)
   * @param options.storage where to physically store data (default is `browser.storage.local`)
   */
  constructor(
    name: string,
    writable: Writable<T>,
    {
      transformer = (x) => x as T,
      storage = browser.storage.local,
    }: {
      transformer?: (parsed: unknown) => T
      storage?: Storage.StorageArea
    } = {}
  ) {
    this.name = name
    this.writable = writable

    // Asynchronously load data from browser storage
    let loaded = false

    this.writable.subscribe((value) => {
      if (loaded) storage.set({ [this.name]: value })
    })

    this.writable.update((value) => {
      storage
        .get({ [this.name]: value })
        .then(({ [this.name]: value }) => transformer(value))
        .then((value) => {
          this.writable.set(value)
          loaded = true
        })
      return value
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
