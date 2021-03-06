import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { Icon, useFolders, Tooltip } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { getCurrentFolders } from '../../helpers/labels';

interface Props {
    message?: Message;
    mailSettings: MailSettings;
    shouldStack?: boolean;
    showTooltip?: boolean;
}

const ItemLocation = ({ message, mailSettings, shouldStack = false, showTooltip = true }: Props) => {
    const [customFolders = []] = useFolders();
    let infos = getCurrentFolders(message, customFolders, mailSettings);

    if (infos.length > 1 && shouldStack) {
        infos = [
            {
                to: infos.map((info) => info.to).join(','),
                name: infos.map((info) => info.name).join(', '),
                icon: 'parent-folder'
            }
        ];
    }

    return (
        <>
            {infos.map(({ icon, name, to }) => (
                <Tooltip className="mr0-25" title={showTooltip ? name : undefined} key={to}>
                    <span className="flex flex-item-noshrink pt0-125">
                        <Icon name={icon} alt={name} />
                    </span>
                </Tooltip>
            ))}
        </>
    );
};

export default ItemLocation;
