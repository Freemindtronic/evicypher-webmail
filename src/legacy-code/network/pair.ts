import type { TaskContext } from '$/task'
import type { Reporter } from '../../report'
import axlsign, { KeyPair } from 'axlsign'
import { fromUint8Array } from 'js-base64'
import { Certificate } from '$/certificate'
import { Request } from '../../background/protocol'
import { AesUtil } from '../cryptography/aes-util'
import { longToByteArray, random, sha256, uint8ToHex, xor } from '../utils'
import { sendRequest } from './exchange'
import { search } from './search'

export class PairingKey {
  static async generate(): Promise<PairingKey> {
    const port = Math.floor(Math.random() * 61_000) + 1025
    const certificate = Certificate.generate()
    const k1 = axlsign.generateKeyPair(random(32))
    const key = random(16)
    const iv = random(16)
    const salt = random(16)
    const TkeyPromise = sha256(new Uint8Array([...iv, ...salt]))

    const enc = new AesUtil(256, 1000).encryptCTR(iv, salt, key, k1.public)

    const qrData = fromUint8Array(
      new Uint8Array([
        ...certificate.id,
        ...longToByteArray(port),
        ...iv,
        ...certificate.sKey,
        ...key,
        ...enc,
      ])
    )

    return new PairingKey({
      certificate,
      port,
      key,
      salt,
      k1,
      iv,
      tKey: await TkeyPromise,
      qrData,
    })
  }

  readonly certificate: Certificate
  readonly port: number
  readonly key: Uint8Array
  readonly salt: Uint8Array
  readonly tKey: Uint8Array
  readonly iv: Uint8Array
  readonly k1: KeyPair
  readonly qrData: string

  constructor({
    certificate,
    port,
    key,
    salt,
    k1,
    iv,
    tKey,
    qrData,
  }: {
    certificate: Certificate
    port: number
    key: Uint8Array
    salt: Uint8Array
    k1: axlsign.KeyPair
    iv: Uint8Array
    tKey: Uint8Array
    qrData: string
  }) {
    this.certificate = certificate
    this.port = port
    this.key = key
    this.salt = salt
    this.k1 = k1
    this.iv = iv
    this.tKey = tKey
    this.qrData = qrData
  }
}

export async function clientHello(
  context: TaskContext,
  pairingKey: PairingKey,
  signal: AbortSignal,
  reporter: Reporter
): Promise<Device> {
  const ip = await search(
    context,
    Request.PairingStart,
    { t: await sha256(pairingKey.certificate.id) },
    {
      signal,
      portOverride: pairingKey.port,
      reporter,
    }
  )
  return new Device(ip, pairingKey)
}

export class Device {
  readonly IP: string
  readonly pairingKey: PairingKey
  readonly certificate: Certificate
  readonly port: number
  AES: AesUtil

  constructor(ip: string, pairingKey: PairingKey) {
    this.IP = ip
    this.port = pairingKey.port
    this.pairingKey = pairingKey
    this.certificate = pairingKey.certificate
    this.AES = new AesUtil(256, 1000)
  }

  async clientKeyExchange(): Promise<{
    name: string
    UUID: string
    ECC: Uint8Array
  }> {
    const ivS = random(16)
    const enc = this.AES.encryptCTR(
      ivS,
      this.certificate.id,
      this.pairingKey.key,
      this.pairingKey.salt
    )

    const data = await sendRequest({
      ip: this.IP,
      port: this.port,
      type: Request.PairingSalt,
      data: {
        t: await sha256(xor(this.certificate.id, this.pairingKey.salt)),
        s: enc,
        i: ivS,
      },
    })

    const salt = xor(this.pairingKey.salt, data.sk)
    const ecc = this.AES.decryptCTR(data.ik, salt, this.pairingKey.key, data.ek)
    const sharedKey = axlsign.sharedKey(this.pairingKey.k1.private, ecc)

    const name = this.AES.decryptCTR(
      data.in,
      data.sn,
      this.pairingKey.tKey,
      data.n
    )

    const uuidU8 = this.AES.decryptCTR(
      data.iu,
      data.su,
      this.pairingKey.tKey,
      data.u
    )
    const uuid = uint8ToHex(uuidU8)

    return { name: new TextDecoder().decode(name), UUID: uuid, ECC: sharedKey }
  }

  async sendNameInfo(
    name: string,
    sharedKey: Uint8Array
  ): Promise<Certificate> {
    const ivS = random(16)
    const saltb = random(16)
    const enc = this.AES.encryptCTR(
      ivS,
      saltb,
      this.pairingKey.tKey,
      new TextEncoder().encode(name)
    )
    await sendRequest({
      ip: this.IP,
      port: this.port,
      type: Request.PairingName,
      data: { i: ivS, n: enc, s: saltb },
    })

    // Paralellize hashes calculations
    const hashes = {
      id: sha256(
        new Uint8Array([...this.pairingKey.tKey, ...this.certificate.id])
      ),
      sKey: sha256(this.certificate.sKey),
      tKey: sha256(this.pairingKey.key),
      jamming: sha256(new Uint8Array([...this.pairingKey.iv, ...saltb])),
    }

    const certData = {
      name,
      id: await hashes.id,
      fKey: sharedKey,
      sKey: await hashes.sKey,
      tKey: await hashes.tKey,
      jamming: await hashes.jamming,
    }

    // Return the permanent certificate for this device
    return new Certificate(certData)
  }
}
