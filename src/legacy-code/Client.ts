/* eslint-disable unicorn/filename-case */
/* eslint-disable camelcase */
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

  const keysExchange = ([1, 2, 3] as const).map((i) =>
    encryptKey(
      pingResponse[`iv${i}` as const],
      pingResponse[`sa${i}` as const],
      certificate.tKey,
      pingResponse[`k${i}` as const]
    )
  )

  let secondData: CipherKeyRequest = {
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

  if (keyToGet !== undefined) {
    const ivd = utils.random(16)
    const saltd = utils.random(16)
    const keyd = utils.xor(keysExchange[1].sharedKey, certificate.sKey)
    const encd = AES.encryptCTR(ivd, saltd, keyd, keyToGet)
    secondData = {
      ...secondData,
      ih: ivd,
      sh: saltd,
      dh: encd,
    }
  }

  const answer = await lanUtil.sendRequest({
    ip,
    port,
    type: Request.CIPHER_KEY,
    data: secondData,
  })

  const iv_low = answer.i2
  const salt_low = answer.s2
  const data_low_jam = answer.d2

  const iv_high = answer.i
  const salt_high = answer.s
  const data_high_jam = answer.d

  const key_high = utils.xor(keysExchange[2].sharedKey, certificate.fKey)
  const key_low = utils.xor(keysExchange[1].sharedKey, certificate.fKey)

  const { jamming, fKey, sKey, tKey, id } = certificate
  const jamming_low = utils.sha512(
    utils.concatUint8Array(jamming, keysExchange[0].sharedKey)
  )
  const jamming_high = utils.sha512(
    utils.concatUint8Array(jamming, keysExchange[1].sharedKey)
  )

  const position_jamming_low = jamming[1] ^ keysExchange[0].sharedKey[1]
  const position_jamming_high = jamming[2] ^ keysExchange[0].sharedKey[2]

  const jammingValueOnLength_low =
    (sKey[0] ^ keysExchange[0].sharedKey[3]) & (jamming_low.length - 1)
  const jammingValueOnLength_high =
    (tKey[0] ^ keysExchange[0].sharedKey[4]) & (jamming_high.length - 1)

  const shift_jamming_low = jamming[0] + (keysExchange[0].sharedKey[5] << 8)
  const shift_jamming_high = jamming[1] + (keysExchange[0].sharedKey[6] << 8)

  const unjam_low = removeJamming(
    jamming_low,
    data_low_jam,
    jammingValueOnLength_low,
    position_jamming_low,
    shift_jamming_low
  )

  const unjam_high = removeJamming(
    jamming_high,
    data_high_jam,
    jammingValueOnLength_high,
    position_jamming_high,
    shift_jamming_high
  )

  const low = AES.decryptCTR(iv_low, salt_low, key_low, unjam_low)
  const high = AES.decryptCTR(iv_high, salt_high, key_high, unjam_high)

  const keys = { high, low }
  const newShare = {
    id: axlsign.generateKeyPair(utils.random(32)),
    k1: axlsign.generateKeyPair(utils.random(32)),
    k2: axlsign.generateKeyPair(utils.random(32)),
    k3: axlsign.generateKeyPair(utils.random(32)),
    k4: axlsign.generateKeyPair(utils.random(32)),
  }

  const dataToSend = {
    id: newShare.id.public,
    k1: newShare.k1.public,
    k2: newShare.k2.public,
    k3: newShare.k3.public,
    k4: newShare.k4.public,
  }

  const newKey = await lanUtil.sendRequest({
    ip,
    port,
    type: Request.END,
    data: dataToSend,
  })
  const newId = { d: axlsign.sharedKey(newShare.k4.private, newKey.k4) }

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

  const nFkey = utils.xor(SK1, fKey)
  const nSkey = utils.xor(SK2, sKey)
  const nTkey = utils.xor(SK3, tKey)
  const nId = utils.xor(SKid, id)
  const nJam = utils.xor(SK4, jamming)

  const newCertificate = new Certificate({
    fKey: nFkey,
    sKey: nSkey,
    tKey: nTkey,
    id: nId,
    jamming: nJam,
  })

  return [keys, newCertificate]
}
