import { Certificate } from './Certificate'
import * as utils from './utils'
import { AesUtil } from './AesUtil'
import axlsign, { KeyPair } from 'axlsign'
import * as Base64 from 'base64-arraybuffer'
import { search, sendCipherADD, sendName } from './lanUtils'

export class PairingKey {
  readonly certificate: Certificate
  readonly port: number
  readonly key: Uint8Array
  readonly salt: Uint8Array
  readonly AES: AesUtil
  readonly Tkey: Uint8Array
  readonly iv: Uint8Array
  readonly k1: KeyPair
  readonly pairingKey: string

  constructor() {
    this.port = Math.floor(Math.random() * 61_000) + 1025
    this.AES = new AesUtil(256, 1000)
    this.certificate = Certificate.generate()
    this.k1 = axlsign.generateKeyPair(utils.random(32))
    this.key = utils.random(16)
    this.iv = utils.random(16)
    this.salt = utils.random(16)
    this.Tkey = utils.sha256(utils.concatUint8Array(this.iv, this.salt))

    const enc = this.AES.encryptCTR(
      this.iv,
      this.salt,
      this.key,
      this.k1.public
    )

    const cA = new Uint8Array([
      ...this.certificate.id,
      ...utils.longToByteArray(this.port),
      ...this.iv,
      ...this.certificate.sKey,
      ...this.key,
      ...enc,
    ])

    this.pairingKey = Base64.encode(cA)
  }

  toString(): string {
    return this.pairingKey
  }
}

export async function clientHello(
  pairingKey: PairingKey,
  signal?: AbortSignal
): Promise<Device> {
  const hash = Base64.encode(utils.sha256(pairingKey.certificate.id))
  const answer = await search(hash, '/t', {
    signal,
    portOverride: pairingKey.port,
  })
  return new Device(answer.ip, pairingKey)
}

export class Device {
  readonly IP: string
  readonly pairingKey: PairingKey
  readonly certificate: Certificate
  readonly port: number

  constructor(ip: string, pairingKey: PairingKey) {
    this.IP = ip
    this.port = pairingKey.port
    this.pairingKey = pairingKey
    this.certificate = pairingKey.certificate
  }

  async clientKeyExchange(): Promise<{
    name: string
    UUID: string
    ECC: Uint8Array
  }> {
    if (this.IP === undefined) throw new Error('IP undefined')

    const ivS = utils.random(16)
    const enc = this.pairingKey.AES.encryptCTR(
      ivS,
      this.certificate.id,
      this.pairingKey.key,
      this.pairingKey.salt
    )

    const data = await sendCipherADD(
      this.IP,
      this.port,
      Base64.encode(ivS),
      Base64.encode(enc),
      Base64.encode(
        utils.sha256(utils.xor(this.certificate.id, this.pairingKey.salt))
      )
    )

    let iv = utils.b64ToUint8Array(data.ik)
    let salt = utils.xor(this.pairingKey.salt, utils.b64ToUint8Array(data.sk))
    let cipherText = utils.b64ToUint8Array(data.ek)
    const ECC = this.pairingKey.AES.decryptCTR(
      iv,
      salt,
      this.pairingKey.key,
      cipherText
    )
    const sharedKey = axlsign.sharedKey(this.pairingKey.k1.private, ECC)

    iv = utils.b64ToUint8Array(data.in)
    salt = utils.b64ToUint8Array(data.sn)
    cipherText = utils.b64ToUint8Array(data.n)
    const name = this.pairingKey.AES.decryptCTR(
      iv,
      salt,
      this.pairingKey.Tkey,
      cipherText
    )

    iv = utils.b64ToUint8Array(data.iu)
    salt = utils.b64ToUint8Array(data.su)
    cipherText = utils.b64ToUint8Array(data.u)
    const UUID_U8 = this.pairingKey.AES.decryptCTR(
      iv,
      salt,
      this.pairingKey.Tkey,
      cipherText
    )
    const UUID = utils.uint8ToHex(UUID_U8)

    return { name: utils.uint8ArrayToUTF8(name), UUID, ECC: sharedKey }
  }

  async sendNameInfo(
    name: string,
    sharedKey: Uint8Array
  ): Promise<Certificate> {
    if (this.IP === undefined) throw new Error('Certificate undefined')

    const ivS = utils.random(16)
    const saltb = utils.random(16)
    const enc = this.pairingKey.AES.encryptCTR(
      ivS,
      saltb,
      this.pairingKey.Tkey,
      utils.utf8ToUint8Array(name)
    )
    await sendName(
      this.IP,
      this.port,
      Base64.encode(ivS),
      Base64.encode(saltb),
      Base64.encode(enc)
    )

    const certData = {
      name,
      fKey: sharedKey,
      sKey: utils.sha256(this.certificate.sKey),
      tKey: utils.sha256(this.pairingKey.key),
      jamming: utils.sha256(utils.concatUint8Array(this.pairingKey.iv, saltb)),
      id: utils.sha256(
        utils.concatUint8Array(this.pairingKey.Tkey, this.certificate.id)
      ),
    }

    // Return the permanent certificate for this device
    return new Certificate(certData)
  }
}
