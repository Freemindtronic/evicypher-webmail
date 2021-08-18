/**
 * {@link pair | Pairing task.}
 *
 * @module
 */

import type { BackgroundTask } from '$/task'
import { get, writable } from 'svelte/store'
import { ErrorMessage, ExtensionError } from '$/error'
import { clientHello, PairingKey } from '$/legacy-code/network/pair'
import {
  favoritePhone,
  favoritePhoneId,
  nextPhoneId,
  Phone,
  phones,
} from '$/phones'

/**
 * Pairs the extension with a new phone.
 *
 * @remarks
 *   `BackgroundTask<string, string, boolean>` means that the task sends strings
 *   to the foreground (the QR code data and the UID), receives strings from the
 *   foreground (the name of the phone), and returns true at the end (if an
 *   error is encountered, an exception is thrown).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns Whether the pairing was successful
 */
export const pair: BackgroundTask<string, string, true> = async function* (
  context,
  reporter,
  signal
) {
  // Create a pairing QR code and send it to the front end
  const pairingKey = await PairingKey.generate()
  yield pairingKey.qrData

  // Wait for the user to scan the code
  const device = await clientHello(context, pairingKey, signal, reporter)
  const key = await device.clientKeyExchange()

  // Send the UID, and receive the name of the phone
  const phoneName = yield key.UUID
  if (!phoneName) throw new ExtensionError(ErrorMessage.PHONE_NAME_UNDEFINED)

  // Finish the pairing process
  const certificate = await device.sendNameInfo(phoneName, key.ECC)

  // Add the phone to the list, as favorite if none is defined
  const $phone = new Phone(await nextPhoneId(), phoneName, certificate)
  const phone = writable($phone)

  // Register the new phone in the background context
  const networkEntry = context.network.get(device.IP)
  if (networkEntry) networkEntry.phone = { store: phone, keys: undefined }

  phones.update(($phones) => [...$phones, phone])

  // Mark the phone as favorite if none is defined
  if (get(favoritePhone) === undefined) favoritePhoneId.set($phone.id)

  // Pairing successful, send true to the front end
  return true
}
