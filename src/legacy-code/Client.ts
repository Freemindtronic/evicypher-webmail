/* eslint-disable unicorn/filename-case */
import axlsign from 'axlsign'
import type { Phone } from 'phones'
import { AesUtil, removeJamming } from './AesUtil'
import { Certificate } from './Certificate'
import * as lanUtil from './lanUtils'
import { CipherKeyRequest, Request } from './protocol'
import * as utils from './utils'

const AES = new AesUtil(256, 1000)

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
  const ecc = AES.decryptCTR(iv, salt, passPhrase, cipherText)
  const k = axlsign.generateKeyPair(utils.random(32))
  const sharedKey = axlsign.sharedKey(k.private, ecc)
  const newIv = utils.random(16)
  const newSalt = utils.random(16)
  const enc = AES.encryptCTR(newIv, newSalt, passPhrase, k.public)
  return { sharedKey, iv: newIv, salt: newSalt, encryptedKey: enc }
}

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
  { certificate }: Phone,
  keyToGet?: Uint8Array
): Promise<[KeyPair, Certificate]> => {
  // Find a phone matching the certificate
  const {
    ip,
    port,
    data: pingResponse,
  } = await lanUtil.search(Request.PING, {
    t: certificate.id,
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
    const ivd = utils.random(16)
    const saltd = utils.random(16)
    const keyd = utils.xor(keysExchange[1].sharedKey, certificate.sKey)
    const encd = AES.encryptCTR(ivd, saltd, keyd, keyToGet)
    cipherKeyRequest = {
      ...cipherKeyRequest,
      ih: ivd,
      sh: saltd,
      dh: encd,
    }
  }

  // Ask the phone for some more random data
  const {
    i: highInitializationVector,
    s: highSalt,
    d: highDataJam,
    i2: lowInitializationVector,
    s2: lowSalt,
    d2: lowDataJam,
  } = await lanUtil.sendRequest({
    ip,
    port,
    type: Request.CIPHER_KEY,
    data: cipherKeyRequest,
  })

  // What you're about to read does not even come close to looking like cryptography
  const highKey = utils.xor(keysExchange[2].sharedKey, certificate.fKey)
  const highJamming = utils.sha512(
    utils.concatUint8Array(certificate.jamming, keysExchange[1].sharedKey)
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

  const lowKey = utils.xor(keysExchange[1].sharedKey, certificate.fKey)
  const lowJamming = utils.sha512(
    utils.concatUint8Array(certificate.jamming, keysExchange[0].sharedKey)
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
  const keys = { high, low }

  // To ensure forward secrecy, we share a new secret
  const newShare = {
    id: axlsign.generateKeyPair(utils.random(32)),
    k1: axlsign.generateKeyPair(utils.random(32)),
    k2: axlsign.generateKeyPair(utils.random(32)),
    k3: axlsign.generateKeyPair(utils.random(32)),
    k4: axlsign.generateKeyPair(utils.random(32)),
  }

  // Send the new secret to the phone
  const newKey = await lanUtil.sendRequest({
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
  })
  const newId = { d: axlsign.sharedKey(newShare.k4.private, newKey.k4) }

  // Send an acknowledgement to the phone, to close the exchange
  await lanUtil.sendRequest({
    ip,
    port,
    type: Request.END_OK,
    data: newId,
  })

  const SKid = axlsign.sharedKey(newShare.id.private, newKey.id)
  const SK1 = axlsign.sharedKey(newShare.k1.private, newKey.k1)
  const SK2 = axlsign.sharedKey(newShare.k2.private, newKey.k2)
  const SK3 = axlsign.sharedKey(newShare.k3.private, newKey.k3)
  const SK4 = axlsign.sharedKey(newShare.k4.private, newKey.k4)

  const newCertificate = new Certificate({
    fKey: utils.xor(SK1, certificate.fKey),
    sKey: utils.xor(SK2, certificate.sKey),
    tKey: utils.xor(SK3, certificate.tKey),
    id: utils.xor(SKid, certificate.id),
    jamming: utils.xor(SK4, certificate.jamming),
  })

  return [keys, newCertificate]
}
