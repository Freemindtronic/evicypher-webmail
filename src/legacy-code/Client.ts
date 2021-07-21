/* eslint-disable unicorn/filename-case */
import axlsign from 'axlsign'
import { Certificate } from 'certificate'
import type { Phone } from 'phones'
import { defaultReporter, Reporter, State } from 'report'
import { get } from 'svelte/store'
import type { TaskContext } from 'task'
import {
  CipherKeyRequest,
  CipherKeyResponse,
  EndOkRequest,
  EndResponse,
  Request,
} from '../background/protocol'
import { AesUtil, removeJamming } from './AesUtil'
import { sendRequest } from './lanUtils'
import { concatUint8Array, random, sha512, xor } from './utils'

export interface KeyPair {
  high: Uint8Array
  low: Uint8Array
}

/**
 * Ask the phone for a symetric key.
 *
 * @returns A pair containing the key asked, and a new certificate to save if it
 *   was renewed during the exchange.
 */
export const fetchKeys = async (
  context: TaskContext,
  phone: Phone,
  {
    keyToGet,
    reporter = defaultReporter,
    signal = new AbortController().signal,
  }: {
    keyToGet?: Uint8Array
    reporter?: Reporter
    signal?: AbortSignal
  } = {}
): Promise<{ keys: KeyPair; newCertificate: Certificate }> => {
  reporter({ state: State.WAITING_FOR_PHONE })
  let { certificate } = phone

  // Get the phone already found by the background service
  let networkEntry = [...context.network.entries()].find(
    (entry) => entry[1].phone && get(entry[1].phone) === phone
  )

  // Tell the Zeroconf service to scan faster
  context.scanFaster.set(true)

  // If there is no such phone, wait for one to be found
  while (networkEntry === undefined || networkEntry[1].keys === undefined) {
    await context.newDeviceFound.observe()
    networkEntry = [...context.network.entries()].find(
      (entry) => entry[1].phone && get(entry[1].phone) === phone
    )
  }

  context.scanFaster.set(false)

  // Extract the IP address, port, and keys
  const [ip, { port, keys: pingResponse }] = networkEntry

  try {
    // Try to reach the phone
    reporter({ state: State.WAITING_FOR_FIRST_RESPONSE })
    await sendRequest({
      ip,
      port,
      signal,
      type: Request.IS_ALIVE,
      data: { oskour: 1 },
    })

    // Prepare the three shared secrets for the rest of the exchange
    const keysExchange = ([1, 2, 3] as const).map((i) =>
      encryptKey(
        pingResponse[`iv${i}` as const],
        pingResponse[`sa${i}` as const],
        certificate.tKey,
        pingResponse[`k${i}` as const]
      )
    )

    let cipherKeyRequest: CipherKeyRequest = {
      i1: keysExchange[0].iv,
      i2: keysExchange[1].iv,
      i3: keysExchange[2].iv,
      s1: keysExchange[0].salt,
      s2: keysExchange[1].salt,
      s3: keysExchange[2].salt,
      d1: keysExchange[0].encryptedKey,
      d2: keysExchange[1].encryptedKey,
      d3: keysExchange[2].encryptedKey,
    }

    // If we want a specific key, add its signature to the payload
    if (keyToGet !== undefined) {
      const ivd = random(16)
      const saltd = random(16)
      const keyd = xor(keysExchange[1].sharedKey, certificate.sKey)
      const AES = new AesUtil(256, 1000)
      const encd = AES.encryptCTR(ivd, saltd, keyd, keyToGet)
      cipherKeyRequest = {
        ...cipherKeyRequest,
        ih: ivd,
        sh: saltd,
        dh: encd,
      }
    }

    reporter({ state: State.NOTIFICATION_SENT })

    // Ask the phone for some more random data
    const cipherKeyResponse = await sendRequest({
      ip,
      port,
      type: Request.CIPHER_KEY,
      data: cipherKeyRequest,
      signal,
    })

    const keys = unjamKeys(keysExchange, certificate, cipherKeyResponse)

    // To ensure forward secrecy, we share a new secret
    const newShare = {
      id: axlsign.generateKeyPair(random(32)),
      k1: axlsign.generateKeyPair(random(32)),
      k2: axlsign.generateKeyPair(random(32)),
      k3: axlsign.generateKeyPair(random(32)),
      k4: axlsign.generateKeyPair(random(32)),
    }

    // Send the new secret to the phone
    const newKey = await sendRequest({
      ip,
      port,
      type: Request.END,
      data: {
        id: newShare.id.public,
        k1: newShare.k1.public,
        k2: newShare.k2.public,
        k3: newShare.k3.public,
        k4: newShare.k4.public,
      },
      signal,
    })

    // Create a new certificate with the new secret
    const { acknowledgement, newCertificate } = createNewCertificate(
      newShare,
      newKey,
      certificate
    )
    certificate = newCertificate

    // Send an acknowledgement to the phone, to close the exchange
    await sendRequest({
      ip,
      port,
      type: Request.END_OK,
      data: acknowledgement,
      signal,
    })
    return { keys, newCertificate }
  } finally {
    // Get the keys for the next exchange
    networkEntry[1].keys = await sendRequest({
      ip,
      port,
      type: Request.PING,
      data: { t: certificate.id },
    })
  }
}

/** Does some encryption stuff, it's still unclear at this time of refactoring. */
const encryptKey = (
  iv: Uint8Array,
  salt: Uint8Array,
  passPhrase: Uint8Array,
  cipherText: Uint8Array
): {
  sharedKey: Uint8Array
  iv: Uint8Array
  salt: Uint8Array
  encryptedKey: Uint8Array
} => {
  const AES = new AesUtil(256, 1000)
  const ecc = AES.decryptCTR(iv, salt, passPhrase, cipherText)
  const k = axlsign.generateKeyPair(random(32))
  const sharedKey = axlsign.sharedKey(k.private, ecc)
  const newIv = random(16)
  const newSalt = random(16)
  const enc = AES.encryptCTR(newIv, newSalt, passPhrase, k.public)
  return { sharedKey, iv: newIv, salt: newSalt, encryptedKey: enc }
}

/** What you're about to read does not even come close to looking like cryptography. */
const unjamKeys = (
  keysExchange: Array<{
    sharedKey: Uint8Array
    iv: Uint8Array
    salt: Uint8Array
    encryptedKey: Uint8Array
  }>,
  certificate: Certificate,
  {
    i: highInitializationVector,
    s: highSalt,
    d: highDataJam,
    i2: lowInitializationVector,
    s2: lowSalt,
    d2: lowDataJam,
  }: CipherKeyResponse
): { high: Uint8Array; low: Uint8Array } => {
  const AES = new AesUtil(256, 1000)

  const highKey = xor(keysExchange[2].sharedKey, certificate.fKey)
  const highJamming = sha512(
    concatUint8Array(certificate.jamming, keysExchange[1].sharedKey)
  )
  const highJammingPosition =
    certificate.jamming[2] ^ keysExchange[0].sharedKey[2]
  const highJammingValueOnLength =
    (certificate.tKey[0] ^ keysExchange[0].sharedKey[4]) &
    (highJamming.length - 1)
  const highJammingShift =
    certificate.jamming[1] + (keysExchange[0].sharedKey[6] << 8)
  const highUnjam = removeJamming(
    highJamming,
    highDataJam,
    highJammingValueOnLength,
    highJammingPosition,
    highJammingShift
  )
  // Here is the only "sane" thing: actual AES
  const high = AES.decryptCTR(
    highInitializationVector,
    highSalt,
    highKey,
    highUnjam
  )

  const lowKey = xor(keysExchange[1].sharedKey, certificate.fKey)
  const lowJamming = sha512(
    concatUint8Array(certificate.jamming, keysExchange[0].sharedKey)
  )
  const lowPositionJamming =
    certificate.jamming[1] ^ keysExchange[0].sharedKey[1]
  const lowJammingValueOnLength =
    (certificate.sKey[0] ^ keysExchange[0].sharedKey[3]) &
    (lowJamming.length - 1)
  const lowJammingShift =
    certificate.jamming[0] + (keysExchange[0].sharedKey[5] << 8)
  const lowUnjam = removeJamming(
    lowJamming,
    lowDataJam,
    lowJammingValueOnLength,
    lowPositionJamming,
    lowJammingShift
  )
  const low = AES.decryptCTR(lowInitializationVector, lowSalt, lowKey, lowUnjam)

  // The two keys we asked for
  return { high, low }
}

/** Create a new certificate with the old one. */
const createNewCertificate = (
  newShare: {
    id: axlsign.KeyPair
    k1: axlsign.KeyPair
    k2: axlsign.KeyPair
    k3: axlsign.KeyPair
    k4: axlsign.KeyPair
  },
  newKey: EndResponse,
  certificate: Certificate
): { acknowledgement: EndOkRequest; newCertificate: Certificate } => {
  const SKid = axlsign.sharedKey(newShare.id.private, newKey.id)
  const SK1 = axlsign.sharedKey(newShare.k1.private, newKey.k1)
  const SK2 = axlsign.sharedKey(newShare.k2.private, newKey.k2)
  const SK3 = axlsign.sharedKey(newShare.k3.private, newKey.k3)
  const SK4 = axlsign.sharedKey(newShare.k4.private, newKey.k4)

  const newCertificate = new Certificate({
    id: xor(SKid, certificate.id),
    fKey: xor(SK1, certificate.fKey),
    sKey: xor(SK2, certificate.sKey),
    tKey: xor(SK3, certificate.tKey),
    jamming: xor(SK4, certificate.jamming),
  })

  const acknowledgement = {
    d: axlsign.sharedKey(newShare.k4.private, newKey.k4),
  }
  return { acknowledgement, newCertificate }
}
