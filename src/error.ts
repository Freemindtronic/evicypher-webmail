/**
 * An extension error is an error thrown when a user action fails. For instance,
 * if no favorite phone is defined, or if EviDNS is not installed.
 *
 * They are meant to be translated and displayed to the user. They must contain
 * useful information to solve the issue.
 *
 * Not all errors should be extension errors -some are thrown because the
 * implementation is buggy- these should be usual Error.
 */
export class ExtensionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExtensionError'
  }
}

export enum ErrorMessage {
  CANCELLED_BY_USER,
  FAVORITE_DEVICE_UNDEFINED,
  FILE_NAME_TOO_LONG,
  FILE_NOT_RECOGNIZED,
  MAIL_CONTENT_UNDEFINED,
  PHONE_NAME_UNDEFINED,
  TOO_MANY_ATTEMPTS,
  WRONG_KEY,
  ZEROCONF_UNAVAILABLE,
}
