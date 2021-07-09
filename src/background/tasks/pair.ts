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

/** Pairs the extension with a new phone. */
export const pair: BackgroundTask<string, string, boolean> = async function* (
  context,
  reporter,
  signal
) {
  // Create a pairing QR code and send it to the front end
  const pairingKey = new PairingKey()
  yield pairingKey.toString()

  // Wait for the user to scan the code
  const device = await clientHello(context, pairingKey, signal, reporter)
  const key = await device.clientKeyExchange()

  // Send the UID, and receive the name of the phone
  const phoneName = yield key.UUID
  if (!phoneName) throw new Error('Empty phone name.')

  // Finish the pairing process
  const certificate = await device.sendNameInfo(phoneName, key.ECC)

  // Add the phone to the list, as favorite if none is defined
  const phone = new Phone(await nextPhoneId(), phoneName, certificate)
  phones.update(($phones) => [...$phones, phone])
  if (get(favoritePhone) === undefined) favoritePhoneId.set(phone.id)

  // Pairing successful, send true to the front end
  return true
}
