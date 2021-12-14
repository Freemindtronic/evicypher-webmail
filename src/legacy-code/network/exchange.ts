import type { Phone } from '$/phones'
import type { TaskContext } from '$/task'
import axlsign from 'axlsign'
import { fromUint8Array, toUint8Array } from 'js-base64'
import { get, Writable } from 'svelte/store'
import {
  BasicLabelRequest,
  BasicLabelResponse,
  CipherKeyRequest,
  CredentialRequest,
  EndOkRequest,
  EndResponse,
  PingResponse,
  Request,
  RequestMap,
  ResponseMap,
} from '$/background/protocol'
import { Certificate } from '$/certificate'
import { ErrorMessage, ExtensionError } from '$/error'
import { AesUtil } from '$/legacy-code/cryptography/AesUtil'
import { removeJamming } from '$/legacy-code/cryptography/jamming'
import { random, sha512, xor, stringToUint8Array } from '$/legacy-code/utils'
import { Reporter, State } from '$/report'

/** @returns An HTTP address created from `ip`, `port` and `type` */
const formatURL = (ip: string, port: number, type = ''): string =>
  `http://${ip}:${port}${type}`

/**
 * Converts a request object to an HTTP body object. For some unknown reasons,
 * requests are URL-encoded, but responses are in JSON.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const toURLSearchParams = (obj: object): URLSearchParams =>
  new URLSearchParams(
    Object.entries(obj).map(([key, value]) => [
      key,
      value instanceof Uint8Array
        ? fromUint8Array(value)
        : `${value as string}`,
    ])
  )

type JSONResponse<T> = {
  readonly [K in keyof T]: string | number
}

/**
 * Converts a JSON-decoded response to a native JavaScript object. Strings are
 * converted to `Uint8Array`.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const fromJSON = <T extends object>(obj: JSONResponse<T>): T =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === 'string' ? toUint8Array(value) : value,
    ])
  ) as unknown as T

/** Default timeout values, based on the request type. */
export const defaultTimeouts: Record<Request, number> = {
  [Request.Ping]: 20_000,
  [Request.Credential]: 180_000,
  [Request.CloudKey]: 180_000,
  [Request.CipherKey]: 180_000,
  [Request.End]: 3000,
  [Request.EndOk]: 3000,
  [Request.PairingStart]: 20_000,
  [Request.PairingSalt]: 3000,
  [Request.PairingName]: 3000,
  [Request.IsAlive]: 180_000,
}

/**
 * Sends a request to a phone.
 *
 * @param ip - The IP of the phone
 * @param port - The port of the phone
 * @param type - The request type, see {@link Request}
 * @param data - The request body, see {@link RequestMap}
 * @param timeout - A time out, in milliseconds (-1 to disable timeout, see
 *   {@link defaultTimeouts})
 * @param signal - An abort signal
 * @returns A promise that resolves to the response, see {@link ResponseMap}
 */
export const sendRequest = async <T extends keyof RequestMap>({
  ip,
  port,
  type,
  data,
  timeout,
  signal,
}: {
  ip: string
  port: number
  type: T
  data: RequestMap[T]
  timeout?: number
  signal?: AbortSignal
}): Promise<ResponseMap[T]> => {
  // Create an AbortController to trigger a timeout
  const controller = new AbortController()

  timeout = timeout ?? defaultTimeouts[type]
  if (timeout >= 0) {
    setTimeout(() => {
      controller.abort()
    }, timeout)
  }

  if (signal?.aborted) throw new ExtensionError(ErrorMessage.CanceledByUser)
  signal?.addEventListener('abort', () => {
    controller.abort()
  })

  // Send a POST request
  const response = await fetch(formatURL(ip, port, type), {
    method: 'POST',
    body: toURLSearchParams(data),
    signal: controller.signal,
    mode: 'cors',
  })

  // If the phone responded with an HTTP error, throw
  throwOnHttpErrors(response)

  const responseData = (await response.json()) as JSONResponse<ResponseMap[T]>

  // @ts-expect-error For some mysterious reason, there is sometimes an
  // `n` field in the response, that contains a boolean (meaning "new"
  // or something), but stored as a string. Since it breaks unserialization
  // and it is not properly documented (ahah), we remove it.
  if (type !== Request.PairingSalt) delete responseData.n

  return fromJSON(responseData)
}

/** Filters out responses containing an HTTP error code. */
// eslint-disable-next-line complexity
export const throwOnHttpErrors = (response: Response): void => {
  // `204 No Content` is not properly used (who could have guessed?) and
  // is sent when the user refuses the request on their phone.
  if (response.status === 204)
    throw new ExtensionError(ErrorMessage.RefuseOnPhone)

  // `400 Bad Request` and `500 Internal Server Error` are generic errors,
  // sent whenever something is wrong, but it is not clear what exactly is wrong.
  if (response.status === 400 || response.status === 500)
    throw new ExtensionError(ErrorMessage.UnknownPhoneError)

  // When the user takes too long respond on their phone, the phone
  // automatically declines the request.
  if (response.status === 408)
    throw new ExtensionError(ErrorMessage.RequestTimeout)

  // When two or more requests are sent to the same phone, all but the last
  // one will be ignored.
  if (response.status === 409) throw new ExtensionError(ErrorMessage.Conflict)

  // When two or more requests are sent to the same phone, all but the last
  // one will be ignored.
  if (response.status === 500) throw new ExtensionError(ErrorMessage.Conflict)

  // Other error codes are not properly handled and translated yet, they will
  // be replaced with a generic error message: `UNKNOWN_ERROR`.
  // That is the main difference between `Error` and `ExtensionError`:
  // `ErrorMessage` has a discrete set of possible errors.
  if (response.status >= 300) {
    throw new Error(
      `Unexpected HTTP response code: ${response.status} ${response.statusText}.`
    )
  }
}

interface KeyPair {
  high: Uint8Array
  low: Uint8Array
}

/**
 * Ask the phone for a label
 *
 * @returns A pair containing the label asked, and a new certificate to save if
 *   it was renewed during the exchange.
 */
const fetchRequest = async (
  phone: Phone,
  getDataRequest: (
    toGet: Uint8Array | undefined,
    sharedKey: Uint8Array,
    sKey: Uint8Array,
    request: BasicLabelRequest
  ) => BasicLabelRequest,
  requestType: Request,
  {
    toGet,
    context,
    reporter,
    signal,
  }: {
    toGet?: Uint8Array
    context: TaskContext
    reporter: Reporter
    signal: AbortSignal
  }
): Promise<{ keys: KeyPair; newCertificate: Certificate }> => {
  reporter({ state: State.WaitingForPhone })
  let { certificate } = phone

  const { ip, port, keys: phoneKeys } = await getPhoneIp(context, signal, phone)

  reporter({ state: State.WaitingForFirstResponse })

  // If the keys expired, fetch a new certificate
  // The keys come from the Zeroconf service: when a phone is found by the
  // service, the service tries to idenfies it. Since the protocol was not
  // designed for this feature, the service tries all known certificates by
  // starting a key exchange with the phone. Because of another weird design
  // choice, the phone does not allow to start two exchanges in less than
  // 3 seconds. Therefore, the keys are stored in the context, and only
  // regenerated if expired. (i.e. more than 3 seconds elapsed)
  let pingResponse: PingResponse
  if (!phoneKeys || phoneKeys.date + 3000 < Date.now()) {
    pingResponse = await sendRequest({
      ip,
      port,
      type: Request.Ping,
      data: { t: certificate.id },
    })
  } else {
    pingResponse = phoneKeys.pingResponse
    // Just check that the phone is online
    await sendRequest({
      ip,
      port,
      signal,
      type: Request.IsAlive,
      data: { oskour: 1 },
    })
  }

  // Prepare the three shared secrets for the rest of the exchange
  const keysExchange = ([1, 2, 3] as const).map((i) =>
    encryptKey(
      pingResponse[`iv${i}` as const],
      pingResponse[`sa${i}` as const],
      certificate.tKey,
      pingResponse[`k${i}` as const]
    )
  )

  let dataRequest: BasicLabelRequest = {
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

  dataRequest = getDataRequest(
    toGet,
    keysExchange[1].sharedKey,
    certificate.sKey,
    dataRequest
  )

  reporter({ state: State.NotificationSent })

  // Ask the phone for some more random data
  const labelResponse = (await sendRequest({
    ip,
    port,
    type: requestType,
    data: dataRequest,
    signal,
  })) as BasicLabelResponse

  const keys = await unjamKeys(keysExchange, certificate, labelResponse)

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
    type: Request.End,
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
    type: Request.EndOk,
    data: acknowledgement,
    signal,
  })
  return { keys, newCertificate }
}

/** Return the key data request enrich with the key hash */
const getKeyRequestData = (
  keyToGet: Uint8Array | undefined,
  sharedKey: Uint8Array,
  sKey: Uint8Array,
  request: CipherKeyRequest
): CipherKeyRequest => {
  if (keyToGet === undefined) return request

  // If we want a specific key, add its signature to the payload
  const ivd = random(16)
  const saltd = random(16)
  const keyd = xor(sharedKey, sKey)
  const AES = new AesUtil(256, 1000)
  const encd = AES.encryptCTR(ivd, saltd, keyd, keyToGet)
  return {
    ...request,
    ih: ivd,
    sh: saltd,
    dh: encd,
  }
}

/** Return the credential data request enrich with the website url */
const getCredentialRequestData = (
  websiteUrl: Uint8Array | undefined,
  sharedKey: Uint8Array,
  sKey: Uint8Array,
  request: CredentialRequest
): CredentialRequest => {
  // If we want a specific key, add its signature to the payload
  if (websiteUrl === undefined) return request

  const ivd = random(16)
  const saltd = random(16)
  const keyd = xor(sharedKey, sKey)
  const AES = new AesUtil(256, 1000)
  const encd = AES.encryptCBC(ivd, saltd, keyd, websiteUrl)
  return {
    ...request,
    id: ivd,
    sd: saltd,
    dd: encd,
  }
}

/**
 * Sends a key request to the phone, saves the new certificate, prepares the
 * next exchange and returns the keys.
 */
export const fetchAndSaveKeys = async (
  context: TaskContext,
  phone: Writable<Phone>,
  {
    keyToGet,
    reporter,
    signal,
  }: {
    keyToGet?: Uint8Array
    reporter: Reporter
    signal: AbortSignal
  }
): Promise<KeyPair> => {
  const $phone = get(phone)
  const { keys, newCertificate } = await fetchRequest(
    $phone,
    getKeyRequestData,
    Request.CipherKey,
    {
      toGet: keyToGet,
      context,
      reporter,
      signal,
    }
  )
  $phone.certificate = newCertificate
  phone.update(($phone) => $phone)
  return keys
}

/**
 * Ask the phone for a credential pair (login/password).
 *
 * @returns A pair containing the credential asked
 */
export const fetchAndSaveCredentials = async (
  context: TaskContext,
  phone: Writable<Phone>,
  {
    websiteUrl,
    reporter,
    signal,
  }: {
    websiteUrl?: string
    reporter: Reporter
    signal: AbortSignal
  }
): Promise<KeyPair> => {
  const $phone = get(phone)
  const toGet = websiteUrl ? stringToUint8Array(websiteUrl) : undefined
  const { keys, newCertificate } = await fetchRequest(
    $phone,
    getCredentialRequestData,
    Request.Credential,
    {
      toGet,
      context,
      reporter,
      signal,
    }
  )
  $phone.certificate = newCertificate
  phone.update(($phone) => $phone)
  return keys
}

/**
 * Ask the phone for a cloud key pair (id/password).
 *
 * @returns A pair containing a cloud key
 */
export const fetchAndSaveCloudKey = async (
  context: TaskContext,
  phone: Writable<Phone>,
  {
    reporter,
    signal,
  }: {
    reporter: Reporter
    signal: AbortSignal
  }
): Promise<KeyPair> => {
  const $phone = get(phone)
  // Sending '#' as data tells the phone to let the user choose the label
  const toGet = stringToUint8Array('#')
  const { keys, newCertificate } = await fetchRequest(
    $phone,
    getCredentialRequestData,
    Request.CloudKey,
    {
      toGet,
      context,
      reporter,
      signal,
    }
  )
  $phone.certificate = newCertificate
  phone.update(($phone) => $phone)
  return keys
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

/** Unjams keys. */
const unjamKeys = async (
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
  }: BasicLabelResponse
): Promise<{ high: Uint8Array; low: Uint8Array }> => {
  const AES = new AesUtil(256, 1000)

  const highHashPromise = sha512(
    new Uint8Array([...certificate.jamming, ...keysExchange[1].sharedKey])
  )
  const lowHashPromise = sha512(
    new Uint8Array([...certificate.jamming, ...keysExchange[0].sharedKey])
  )

  const highKey = xor(keysExchange[2].sharedKey, certificate.fKey)
  const highJamming = await highHashPromise
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
  const high = AES.decryptCTR(
    highInitializationVector,
    highSalt,
    highKey,
    highUnjam
  )

  const lowKey = xor(keysExchange[1].sharedKey, certificate.fKey)
  const lowJamming = await lowHashPromise
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

/**
 * Gets the IP of a phone found by the Zeroconf service. If the phone given is
 * not yet connected, the function waits for it to connect.
 */
const getPhoneIp = async (
  context: TaskContext,
  signal: AbortSignal,
  phone: Phone
): Promise<{
  ip: string
  port: number
  keys:
    | {
        pingResponse: PingResponse
        date: number
      }
    | undefined
}> => {
  // Get the phone already found by the background service
  let entry:
    | [
        string,
        {
          port: number
          lastSeen: number
          phone?: {
            store: Writable<Phone>
            keys?: {
              pingResponse: PingResponse
              date: number
            }
          }
        }
      ]
    | undefined

  const handleAbort = () => {
    context.scanFaster.set(false)
    throw new Error(ErrorMessage.CanceledByUser)
  }

  // Stop fast scanning if abort
  if (signal.aborted) throw new Error(ErrorMessage.CanceledByUser)
  signal.addEventListener('abort', handleAbort)

  // Tell the Zeroconf service to scan faster
  context.scanFaster.set(true)

  while (
    !(entry = [...context.network.entries()].find(
      (entry) => entry[1].phone && get(entry[1].phone.store) === phone
    )) ||
    entry[1].phone === undefined
  ) {
    // If there is no such phone, wait for one to be found
    await context.newDeviceFound.observe()
  }

  context.scanFaster.set(false)
  signal.removeEventListener('abort', handleAbort)

  // Extract the IP address, port, and keys
  const [
    ip,
    {
      port,
      phone: { keys },
    },
  ] = entry

  return { ip, port, keys }
}
