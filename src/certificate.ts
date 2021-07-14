import { serialize, Serialize, unserialize } from './legacy-code/lanUtils'
import { random } from './legacy-code/utils'

/**
 * An implementation of CertificateData, with methods to produce new
 * certificates and to serialize.
 */
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
      id: random(16),
      fKey: random(16),
      sKey: random(16),
      tKey: random(16),
      jamming: random(16),
    })
  }

  /** Unserializes the certificate. */
  static fromJSON(data: Serialize<Certificate>): Certificate {
    return new Certificate(unserialize(data))
  }

  /** Serializes the certificate. */
  toJSON(): Serialize<Certificate> {
    return serialize<Certificate>(this)
  }
}
