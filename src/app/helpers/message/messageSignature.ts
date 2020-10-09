import { MailSettings } from 'proton-shared/lib/interfaces';
import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { message } from 'proton-shared/lib/sanitize';

import { MESSAGE_ACTIONS } from '../../constants';
import { dedentTpl } from '../dedent';
import { replaceLineBreaks } from '../string';
import { parseInDiv, isHTMLEmpty } from '../dom';
import { MessageExtended } from '../../models/message';
import { isPlainText } from './messages';
import { getPlainTextContent, exportPlainText } from './messageContent';
import { CLASSNAME_BLOCKQUOTE } from './messageDraft';

export const CLASSNAME_SIGNATURE_CONTAINER = 'protonmail_signature_block';
export const CLASSNAME_SIGNATURE_USER = 'protonmail_signature_block-user';
export const CLASSNAME_SIGNATURE_PROTON = 'protonmail_signature_block-proton';
export const CLASSNAME_SIGNATURE_EMPTY = 'protonmail_signature_block-empty';

/**
 * Preformat the protonMail signature
 */
const getProtonSignature = (mailSettings: Partial<MailSettings> = {}) =>
    mailSettings.PMSignature === 0 ? '' : PM_SIGNATURE;

/**
 * Generate a space tag, it can be hidden from the UX via a className
 */
const createSpace = (className = '') => {
    const tagOpen = className ? `<div class="${className}">` : '<div>';
    return `${tagOpen}<br /></div>`;
};

/**
 * Generate spaces for the signature
 *     No signature: 1 space
 *     addressSignature: 2 spaces + addressSignature
 *     protonSignature: 2 spaces + protonSignature
 *     user + proton signature: 2 spaces + addressSignature + 1 space + protonSignature
 */
const getSpaces = (signature: string, protonSignature: string, isReply = false) => {
    const isUserEmpty = isHTMLEmpty(signature);
    const isEmptySignature = isUserEmpty && !protonSignature;
    return {
        start: isEmptySignature ? createSpace() : createSpace() + createSpace(),
        end: isReply ? createSpace() : '',
        between: !isUserEmpty && protonSignature ? createSpace() : ''
    };
};

/**
 * Generate a map of classNames used for the signature template
 */
const getClassNamesSignature = (signature: string, protonSignature: string) => {
    const isUserEmpty = isHTMLEmpty(signature);
    const isProtonEmpty = !protonSignature;
    return {
        userClass: isUserEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
        protonClass: isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
        containerClass: isUserEmpty && isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : ''
    };
};

/**
 * Generate the template for a signature and clean it
 */
export const templateBuilder = (
    signature = '',
    mailSettings: Partial<MailSettings> | undefined = {},
    isReply = false,
    noSpace = false
) => {
    const protonSignature = getProtonSignature(mailSettings);
    const { userClass, protonClass, containerClass } = getClassNamesSignature(signature, protonSignature);
    const space = getSpaces(signature, protonSignature, isReply);

    const template = dedentTpl`
        <div class="${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}">
            <div class="${CLASSNAME_SIGNATURE_USER} ${userClass}">
                ${replaceLineBreaks(signature)}
            </div>
            ${space.between}
            <div class="${CLASSNAME_SIGNATURE_PROTON} ${protonClass}">
                ${replaceLineBreaks(protonSignature)}
            </div>
        </div>
    `;

    if (!noSpace) {
        return `${space.start}${message(template)}${space.end}`;
    }

    return message(template);
};

/**
 * Insert Signatures before the message
 *     - Always append a container signature with both user's and proton's
 *     - Theses signature can be empty but the dom remains
 */
export const insertSignature = (
    content = '',
    signature = '',
    action: MESSAGE_ACTIONS,
    mailSettings: MailSettings,
    isAfter = false
) => {
    const position = isAfter ? 'beforeend' : 'afterbegin';
    const template = templateBuilder(signature, mailSettings, action !== MESSAGE_ACTIONS.NEW);

    // Parse the current message and append before it the signature
    const element = parseInDiv(content);
    element.insertAdjacentHTML(position, template);

    return element.innerHTML;
};

/**
 * Return the content of the message with the signature switched from the old one to the new one
 */
export const changeSignature = (
    message: MessageExtended,
    mailSettings: Partial<MailSettings> | undefined,
    oldSignature: string,
    newSignature: string
) => {
    if (isPlainText(message.data)) {
        const oldTemplate = templateBuilder(oldSignature, mailSettings, false, true);
        const newTemplate = templateBuilder(newSignature, mailSettings, false, true);
        const content = getPlainTextContent(message);
        const oldSignatureText = exportPlainText(oldTemplate).trim();
        const newSignatureText = exportPlainText(newTemplate).trim();
        return content.replace(oldSignatureText, newSignatureText);
    } else {
        const document = message.document as Element;

        const userSignature = [...document.querySelectorAll(`.${CLASSNAME_SIGNATURE_USER}`)].find(
            (element) => element.closest(`.${CLASSNAME_BLOCKQUOTE}`) === null
        );

        if (userSignature) {
            const protonSignature = getProtonSignature(mailSettings);
            const { userClass, containerClass } = getClassNamesSignature(newSignature, protonSignature);

            userSignature.innerHTML = replaceLineBreaks(newSignature);
            userSignature.className = `${CLASSNAME_SIGNATURE_USER} ${userClass}`;

            const signatureContainer = userSignature?.closest(`.${CLASSNAME_SIGNATURE_CONTAINER}`);
            if (signatureContainer && signatureContainer !== null) {
                signatureContainer.className = `${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}`;
            }
        }

        return document.innerHTML;
    }
};
