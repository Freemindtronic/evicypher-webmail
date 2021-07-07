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

export const pair: BackgroundTask<
  { phoneName: string },
  string,
  boolean,
  boolean | undefined
> = async function* ({ phoneName }, reporter, signal) {
  const pairingKey = new PairingKey()

  // Send the pairing QR code
  yield pairingKey.toString()

  // Wait for the user to scan the code
  const device = await clientHello(pairingKey, signal, reporter)
  const key = await device.clientKeyExchange()

  // Send the UID
  const confirmation = yield key.UUID

  // Wait for the confirmation
  if (!confirmation) return false

  // Send the confirmation request
  const certificate = await device.sendNameInfo(phoneName, key.ECC)
  const phone = new Phone(await nextPhoneId(), phoneName, certificate)

  phones.update(($phones) => [...$phones, phone])

  if (get(favoritePhone) === undefined) {
    favoritePhoneId.set(phone.id)
  }

  return true
}
