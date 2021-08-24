/**
 * Extension errors.
 *
 * All the errors defined below are translated with a user-friendly message. See
 * {@link i18n.translateError}. To throw user-friendly errors, use {@link ExtensionError}.
 *
 * @module
 */

/** List of all possible error messages. */
export enum ErrorMessage {
  CanceledByUser = 'Canceled by user.',
  Conflict = 'Conflict.',
  FavoritePhoneUndefined = 'No favorite phone set.',
  FileNameTooLong = 'Filename too long.',
  FileNotRecognized = 'File not recognized.',
  MailContentUndefined = 'Mail content undefined.',
  PhoneNameUndefined = 'Phone name undefined.',
  PrivateKeyIncorrectPassphrase = 'Incorrect passphrase for the private key.',
  RefuseOnPhone = 'Phone refused.',
  RequestTimeout = 'Request timeout.',
  TooManyAttempts = 'Too many attempts.',
  UnknownError = 'Unknown error.',
  UnknownPhoneError = 'Unknown phone error.',
  WrongKey = 'Wrong key.',
}

/**
 * An extension error is an error thrown when a user action fails. For instance,
 * if no favorite phone is defined, or if EviDNS is not installed.
 *
 * They are meant to be translated and displayed to the user. They must contain
 * useful information to solve the issue.
 *
 * Not all errors should be extension errors (some are thrown because the
 * implementation is buggy) these should be usual Error. If an Error propagates
 * to the user interface, it displayed as an `UNKNOWN_ERROR`, reading `"The
 * extension encountered an error and the operation failed."`.
 */
export class ExtensionError extends Error {
  readonly message: ErrorMessage
  constructor(message: ErrorMessage) {
    super(message)
    this.message = message
    this.name = 'ExtensionError'
  }
}
