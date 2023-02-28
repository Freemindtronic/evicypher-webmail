/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable new-cap */
import axios from 'axios';
import SHA1 from 'crypto-js/sha1.js';
import { corruptedIcon, corruptedIconFocus, noCorruptedIcon, noCorruptedIconFocus, } from '../content-scripts/assets/base64/autofill-icons';
/**
 * The images object is an object literal that has two properties: safe and
 * unsafe. Each of them has a value that is another object with two properties:
 * image and imageFocus. Their values represent base64 encoded image. Used to
 * indicate the security status of a password
 */
export const images = {
    safe: { image: noCorruptedIcon, imageFocus: noCorruptedIconFocus },
    unsafe: { image: corruptedIcon, imageFocus: corruptedIconFocus },
};
/**
 * Takes input field an determines whether the isSafe variable is true or false
 * and assigns a set of images to the imageSet variable.
 *
 * @param field
 */
export const setImage = (field, icon, isSafe) => {
    const imageSet = isSafe ? images.safe : images.unsafe;
    field.style.backgroundImage = `url(data:image/svg+xml;base64,${imageSet.image})`;
    icon.focus = `url(data:image/svg+xml;base64,${imageSet.imageFocus})`;
    icon.blur = `url(data:image/svg+xml;base64,${imageSet.image})`;
};
/**
 * Check if the password has been made public in a data breach.
 *
 * @param password Password to be checked
 */
export const checkPassword = async (password) => {
    const hash = SHA1(password).toString();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    try {
        const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
        return !response.data.includes(suffix.toUpperCase());
    }
    catch (error) {
        console.log('Error:', error);
    }
};
//# sourceMappingURL=have-i-been-pwned.js.map