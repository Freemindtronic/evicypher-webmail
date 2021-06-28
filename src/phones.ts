import { BrowserStore } from 'browser-store'
import { writable, Writable } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'

/** Represent a phone, with a unique identifier and a name. */
export class Phone {
  /** Unique identifier. */
  id: number

  /** Name chosen by the user. */
  name: string

  constructor(id: number, name: string) {
    this.id = id
    this.name = name
  }

  /** Transform an object coming from JSON.parse into a Phone object. */
  static fromObject({ id, name }: { id: number; name: string }): Phone {
    return new Phone(id, name)
  }

  /** User-friendly representation of the object. */
  toString(): string {
    return `#${this.id}: ${this.name}`
  }
}

/** Phone list. */
export const phones: Writable<Phone[]> = new BrowserStore(
  'phones',
  writable([]),
  {
    transformer: (x) =>
      (x as Array<{ id: number; name: string }>).map((obj) =>
        Phone.fromObject(obj)
      ),
  }
)

/** Produce an auto-incremented integer. */
export const nextPhoneId = async (): Promise<number> => {
  const currentValue = (await browser.storage.local.get({ nextPhoneId: 1 }))
    .nextPhoneId as number
  await browser.storage.local.set({ nextPhoneId: currentValue + 1 })
  return currentValue
}

/** Favorite phone id in the list {@link phones} */
export const favoritePhoneId: Writable<number> = new BrowserStore(
  'favoritePhoneId',
  writable(-1)
)
