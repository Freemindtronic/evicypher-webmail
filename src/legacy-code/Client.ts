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

  const crypt = {
    ECC1: AES.decryptCTR(
      pingResponse.iv1,
      pingResponse.sa1,
      certificate.tKey,
      pingResponse.k1
    ),
    ECC2: AES.decryptCTR(
      pingResponse.iv2,
      pingResponse.sa2,
      certificate.tKey,
      pingResponse.k2
    ),
    ECC3: AES.decryptCTR(
      pingResponse.iv3,
      pingResponse.sa3,
      certificate.tKey,
      pingResponse.k3
    ),
  }

  const keysExchange: {
    SK1: Uint8Array | undefined
    SK2: Uint8Array | undefined
    SK3: Uint8Array | undefined
  } = {
    SK1: undefined,
    SK2: undefined,
    SK3: undefined,
  }

  const ivList = []
  const saltList = []
  const encList = []

  for (const [sk, ecc] of [
    ['SK1', 'ECC1'],
    ['SK2', 'ECC2'],
    ['SK3', 'ECC3'],
  ] as const) {
    const k = axlsign.generateKeyPair(utils.random(32))
    keysExchange[sk] = axlsign.sharedKey(k.private, crypt[ecc] as Uint8Array)
    const iv = utils.random(16)
    const salt = utils.random(16)
    const enc = AES.encryptCTR(iv, salt, certificate.tKey, k.public)
    ivList.push(iv)
    saltList.push(salt)
    encList.push(enc)
  }

  let secondData: CipherKeyRequest = {
    i1: ivList[0],
    i2: ivList[1],
    i3: ivList[2],
    s1: saltList[0],
    s2: saltList[1],
    s3: saltList[2],
    d1: encList[0],
    d2: encList[1],
    d3: encList[2],
  }

  if (keyToGet !== undefined) {
    const ivd = utils.random(16)
    const saltd = utils.random(16)
    const keyd = utils.xor(keysExchange.SK2 as Uint8Array, certificate.sKey)
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

  const key_high = utils.xor(keysExchange.SK3 as Uint8Array, certificate.fKey)
  const key_low = utils.xor(keysExchange.SK2 as Uint8Array, certificate.fKey)

  const { jamming, fKey, sKey, tKey, id } = certificate
  const jamming_low = utils.sha512(
    utils.concatUint8Array(jamming, keysExchange.SK1 as Uint8Array)
  )
  const jamming_high = utils.sha512(
    utils.concatUint8Array(jamming, keysExchange?.SK2 as Uint8Array)
  )

  const position_jamming_low = jamming[1] ^ (keysExchange.SK1?.[1] as number)
  const position_jamming_high = jamming[2] ^ (keysExchange.SK1?.[2] as number)

  const jammingValueOnLength_low =
    // eslint-disable-next-line unicorn/consistent-destructuring
    (certificate.sKey[0] ^ (keysExchange.SK1?.[3] as number)) &
    (jamming_low.length - 1)
  const jammingValueOnLength_high =
    // eslint-disable-next-line unicorn/consistent-destructuring
    (certificate.tKey[0] ^ (keysExchange.SK1?.[4] as number)) &
    (jamming_high.length - 1)

  const shift_jamming_low =
    jamming[0] + ((keysExchange.SK1?.[5] as number) << 8)
  const shift_jamming_high =
    jamming[1] + ((keysExchange.SK1?.[6] as number) << 8)

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
