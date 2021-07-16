import { BrowserStore } from 'browser-store'
import { Certificate } from 'certificate'
import { derived, writable, Writable, get } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'

/** Represent a phone, with a unique identifier and a name. */
export class Phone {
  /** Unique identifier. */
  id: number

  /** Name chosen by the user. */
  name: string

  /** Time stamp at which the phone was last seen. */
  lastSeen: number

  /** Public certificate for the device. */
  certificate: Certificate

  constructor(
    id: number,
    name: string,
    certificate: Certificate,
    lastSeen?: number
  ) {
    this.id = id
    this.name = name
    this.lastSeen = lastSeen ?? Date.now()
    this.certificate = certificate
  }

  /** Transform an object coming from JSON.parse into a Phone object. */
  static fromJSON({
    id,
    name,
    lastSeen,
    certificate,
  }: {
    id: number
    name: string
    lastSeen: number
    certificate: ReturnType<Certificate['toJSON']>
  }): Phone {
    return new Phone(id, name, Certificate.fromJSON(certificate), lastSeen)
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      lastSeen: this.lastSeen,
      certificate: this.certificate.toJSON(),
    }
  }

  /** User-friendly representation of the object. */
  toString(): string {
    return `#${this.id}: ${this.name}`
  }
}

/** Phone list. */
export const phones: Writable<Array<Writable<Phone>>> = new BrowserStore(
  'phones',
  writable([]),
  {
    transformer: (x) =>
      (
        x as Array<{
          id: number
          name: string
          lastSeen: number
          certificate: ReturnType<Certificate['toJSON']>
        }>
      ).map((obj) => writable(Phone.fromJSON(obj))),

    fromJSON: (x: Array<Writable<Phone>>) => x.map((obj) => get(obj)),
  }
)

phones.subscribe(($phones) => {
  for (const phone of $phones) {
    if ('subscribed' in phone) continue
    phone.subscribe(() => {
      phones.update(($phones) => $phones)
    })
    // @ts-expect-error We add a "subscribed" property to avoid subscribing several times
    phone.subscribed = true
  }
})

/** Produce an auto-incremented integer. */
export const nextPhoneId = async (): Promise<number> => {
  const currentValue = (await browser.storage.local.get({ nextPhoneId: 1 }))
    .nextPhoneId as number
  await browser.storage.local.set({ nextPhoneId: currentValue + 1 })
  return currentValue
}

/** Favorite phone id in the list {@link phones}. */
export const favoritePhoneId: BrowserStore<number> = new BrowserStore(
  'favoritePhoneId',
  writable(-1)
)

/**
 * The favorite phone is a read-only store derived from two writable stores, it
 * updates whenever one of the two updates.
 */
export const favoritePhone = derived(
  [phones, favoritePhoneId],
  ([$phones, $favoritePhoneId]) =>
    $phones.find((phone) => get(phone).id === $favoritePhoneId)
)
