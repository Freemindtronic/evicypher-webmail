/** List of all possible error messages. */
export enum ErrorMessage {
  CANCELED_BY_USER = 'Canceled by user.',
  CONFLICT = 'Conflict.',
  FAVORITE_PHONE_UNDEFINED = 'No favorite phone set.',
  FILE_NAME_TOO_LONG = 'Filename too long.',
  FILE_NOT_RECOGNIZED = 'File not recognized.',
  MAIL_CONTENT_UNDEFINED = 'Mail content undefined.',
  PHONE_NAME_UNDEFINED = 'Phone name undefined.',
  REFUSED_ON_PHONE = 'Phone refused.',
  REQUEST_TIMEOUT = 'Request timeout.',
  TOO_MANY_ATTEMPTS = 'Too many attempts.',
  UNKNOWN_ERROR = 'Unknown error.',
  UNKNOWN_PHONE_ERROR = 'Unknown phone error.',
  WRONG_KEY = 'Wrong key.',
  ZEROCONF_UNAVAILABLE = 'ZeroConf unavailable.',
}

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
  readonly message: ErrorMessage
  constructor(message: ErrorMessage) {
    super(message)
    this.message = message
    this.name = 'ExtensionError'
  }
}
