/**
 * Extension errors.
 *
 * All the errors defined below are translated with a user-friendly message. See
 * {@link i18n.translateError}. To throw user-friendly errors, use {@link ExtensionError}.
 *
 * @module
 */
/** List of all possible error messages. */
export var ErrorMessage;
(function (ErrorMessage) {
    ErrorMessage["CanceledByUser"] = "Canceled by user.";
    ErrorMessage["Conflict"] = "Conflict.";
    ErrorMessage["FavoritePhoneUndefined"] = "No favorite phone set.";
    ErrorMessage["FileNameTooLong"] = "Filename too long.";
    ErrorMessage["FileNotRecognized"] = "File not recognized.";
    ErrorMessage["FormatNotImplemented"] = "Format not implemented.";
    ErrorMessage["MailContentUndefined"] = "Mail content undefined.";
    ErrorMessage["PhoneNameUndefined"] = "Phone name undefined.";
    ErrorMessage["PrivateKeyIncorrectPassphrase"] = "Incorrect passphrase for the private key.";
    ErrorMessage["RefuseOnPhone"] = "Phone refused.";
    ErrorMessage["RequestTimeout"] = "Request timeout.";
    ErrorMessage["TooManyAttempts"] = "Too many attempts.";
    ErrorMessage["UnknownError"] = "Unknown error.";
    ErrorMessage["UnknownPhoneError"] = "Unknown phone error.";
    ErrorMessage["WrongKey"] = "Wrong key.";
    ErrorMessage["CharacterLimit"] = "Character Limit.";
    ErrorMessage["MailAlreadyEncrypted"] = "Mail Already Encrypted.";
})(ErrorMessage || (ErrorMessage = {}));
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
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'ExtensionError';
    }
}
//# sourceMappingURL=error.js.map