import { derived, writable, Writable, get } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'
import { BrowserStore } from 'browser-store'
import { Certificate } from 'certificate'

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

  /** Initializes a new phone with the arguments given. */
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

  /** Produces a JSON-serializable object. */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      lastSeen: this.lastSeen,
      certificate: this.certificate.toJSON(),
    }
  }

  /** Returns true if the phone was last seen less than 2 minutes ago. */
  get isOnline(): boolean {
    return this.lastSeen + 120_000 > Date.now()
  }
}

/** Phone list. */
export const phones: Writable<Array<Writable<Phone>>> = new BrowserStore(
  'phones',
  writable([]),
  {
    fromJSON: (x) =>
      (
        x as Array<{
          id: number
          name: string
          lastSeen: number
          certificate: ReturnType<Certificate['toJSON']>
        }>
      ).map((obj) => writable(Phone.fromJSON(obj))),

    toJSON: (x: Array<Writable<Phone>>) => x.map((obj) => get(obj)),
  }
)

// Add a subscriber to every new phone
phones.subscribe(($phones) => {
  for (const phone of $phones) {
    if ('subscribed' in phone) continue
    // @ts-expect-error We add a "subscribed" property to avoid subscribing several times
    phone.subscribed = true

    // Do not run the listener on first subscription; if the listener is
    // called on the first subscription, it would cause a load-save-load
    // situation, leading to inconsistencies...
    let first = true
    phone.subscribe(() => {
      if (first) return
      phones.update(($phones) => $phones)
    })
    first = false
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
