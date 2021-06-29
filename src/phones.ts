import { BrowserStore } from 'browser-store'
import { CertDataB64, Certificate } from 'legacy-code/Certificate'
import { derived, writable, Writable } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'

/** Represent a phone, with a unique identifier and a name. */
export class Phone {
  /** Unique identifier. */
  id: number

  /** Name chosen by the user. */
  name: string

  /** Public certificate for the device. */
  certificate: Certificate

  constructor(id: number, name: string, certificate: Certificate) {
    this.id = id
    this.name = name
    this.certificate = certificate
  }

  /** Transform an object coming from JSON.parse into a Phone object. */
  static fromJSON({
    id,
    name,
    certificate,
  }: {
    id: number
    name: string
    certificate: CertDataB64
  }): Phone {
    return new Phone(id, name, Certificate.fromJSON(certificate))
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      certificate: this.certificate.toJSON(),
    }
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
      (x as Array<{ id: number; name: string; certificate: CertDataB64 }>).map(
        (obj) => Phone.fromJSON(obj)
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
    $phones.find((phone) => phone.id === $favoritePhoneId)
)
