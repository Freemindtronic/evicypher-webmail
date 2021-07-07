import { clientHello, PairingKey } from 'legacy-code/device'
import {
  favoritePhone,
  favoritePhoneId,
  nextPhoneId,
  Phone,
  phones,
} from 'phones'
import { get } from 'svelte/store'
import type { BackgroundTask } from 'task'

export const pair: BackgroundTask<string, string | undefined, boolean> =
  async function* (context, reporter, signal) {
    const pairingKey = new PairingKey()

    // Send the pairing QR code
    yield pairingKey.toString()

    // Wait for the user to scan the code
    const device = await clientHello(pairingKey, signal, reporter)
    const key = await device.clientKeyExchange()

    // Send the UID
    const phoneName = yield key.UUID

    if (!phoneName) throw new Error('Empty phone name.')

    // Send the confirmation request
    const certificate = await device.sendNameInfo(phoneName, key.ECC)
    const phone = new Phone(await nextPhoneId(), phoneName, certificate)

    phones.update(($phones) => [...$phones, phone])

    if (get(favoritePhone) === undefined) {
      favoritePhoneId.set(phone.id)
    }

    return true
  }
