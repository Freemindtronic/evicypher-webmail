import { decode, encode } from '@borderless/base64'
import { random } from './legacy-code/utils'

const KEY_SIZE = 16

/** A class to produce new certificates and to serialize them. */
export class Certificate {
  readonly id: Uint8Array
  readonly fKey: Uint8Array
  readonly sKey: Uint8Array
  readonly tKey: Uint8Array
  readonly jamming: Uint8Array

  /** Initializes a certificate with the data given. */
  constructor({
    id,
    jamming,
    fKey,
    sKey,
    tKey,
  }: {
    /** Unique identifier. */
    id: Uint8Array
    /** First key. */
    fKey: Uint8Array
    /** Second key. */
    sKey: Uint8Array
    /** Third key. */
    tKey: Uint8Array
    /** Jamming key. */
    jamming: Uint8Array
  }) {
    this.id = id
    this.fKey = fKey
    this.sKey = sKey
    this.tKey = tKey
    this.jamming = jamming
  }

  /** Produces a new certificate, with random keys. */
  static generate(): Certificate {
    return new Certificate({
      id: random(KEY_SIZE),
      fKey: random(KEY_SIZE),
      sKey: random(KEY_SIZE),
      tKey: random(KEY_SIZE),
      jamming: random(KEY_SIZE),
    })
  }

  /** Unserializes the certificate. */
  static fromJSON({
    id,
    fKey,
    sKey,
    tKey,
    jamming,
  }: ReturnType<Certificate['toJSON']>): Certificate {
    return new Certificate({
      id: decode(id),
      fKey: decode(fKey),
      sKey: decode(sKey),
      tKey: decode(tKey),
      jamming: decode(jamming),
    })
  }

  /** Produces a JSON-serializable object. */
  toJSON(): {
    id: string
    fKey: string
    sKey: string
    tKey: string
    jamming: string
  } {
    return {
      id: encode(this.id),
      fKey: encode(this.fKey),
      sKey: encode(this.sKey),
      tKey: encode(this.tKey),
      jamming: encode(this.jamming),
    }
  }
}
