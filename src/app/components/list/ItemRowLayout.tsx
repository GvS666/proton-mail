import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import ItemStar from './ItemStar';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';
import { Element } from '../../models/element';
import ItemExpiration from './ItemExpiration';

interface Props {
    labelID: string;
    labels?: Label[];
    element: Element;
    mailSettings: any;
    conversationMode: boolean;
    showIcon: boolean;
    senders: string;
    addresses: string;
    unread: boolean;
    displayRecipients: boolean;
    loading: boolean;
}

const ItemRowLayout = ({
    labelID,
    labels,
    element,
    mailSettings = {},
    conversationMode,
    showIcon,
    senders,
    addresses,
    unread,
    displayRecipients,
    loading,
}: Props) => {
    const { Subject, Size } = element;
    const size = humanSize(Size);

    return (
        <div className="flex-item-fluid flex flex-items-center flex-nowrap flex-row item-titlesender">
            <div className="mtauto mbauto flex mr0-5">
                <ItemStar element={element} />
            </div>

            <div className={classnames(['item-senders w20 flex mauto pr1', unread && 'bold'])}>
                <span className="mw100 ellipsis" title={addresses}>
                    {!loading && displayRecipients && !senders ? c('Info').t`(No Recipient)` : senders}
                </span>
            </div>

            <div className="item-subject flex-item-fluid flex flex-items-center flex-nowrap mauto">
                {showIcon && (
                    <span className="mr0-25 inline-flex flex-item-noshrink">
                        <ItemLocation message={element as Message} mailSettings={mailSettings} />
                    </span>
                )}
                {conversationMode && (
                    <NumMessages
                        className={classnames(['mr0-25 flex-item-noshrink', unread && 'bold'])}
                        conversation={element}
                    />
                )}
                <span className={classnames(['inbl mw100 ellipsis mr1', unread && 'bold'])} title={Subject}>
                    {Subject}
                </span>
            </div>

            <ItemLabels labels={labels} element={element} maxNumber={5} className="flex-item-noshrink mlauto" />

            <span className="item-weight mtauto mbauto ml1 alignright">{!loading && size}</span>

            <span className="flex w2e ml0-5 aligncenter">
                <ItemAttachmentIcon element={element} labelID={labelID} className="flex-item-noshrink" />
            </span>

            <span className="item-senddate-row w13e ml1 flex flex-nowrap flex-items-center flex-justify-end">
                {!!element.ExpirationTime && <ItemExpiration element={element} className="mr0-5" />}
                <ItemDate element={element} labelID={labelID} className={unread ? 'bold' : undefined} />
            </span>
        </div>
    );
};

export default ItemRowLayout;
