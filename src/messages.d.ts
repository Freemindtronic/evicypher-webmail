export interface EncryptRequest {
  type: 'encrypt-request'
  string: string
}

export interface DecryptRequest {
  type: 'decrypt-request'
  string: string
}

export type Message = EncryptRequest | DecryptRequest
