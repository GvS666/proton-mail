import React from 'react';
import {
    Icon,
    useLoading,
    useNotifications,
    useEventManager,
    useApi,
    ConfirmModal,
    ErrorButton,
    useModals,
    Alert,
} from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { deleteMessages } from 'proton-shared/lib/api/messages';
import { deleteConversations } from 'proton-shared/lib/api/conversations';
import { c, msgid } from 'ttag';

import ToolbarButton from './ToolbarButton';
import { useGetElementsFromIDs } from '../../hooks/useElementsCache';
import { isConversation } from '../../helpers/elements';

const { DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const getDeleteTitle = (isDraft: boolean, isConversationMode: boolean, count: number) => {
    if (isDraft) {
        if (count === 1) {
            return c('Title').t`Delete draft`;
        }
        return c('Title').ngettext(msgid`Delete ${count} draft`, `Delete ${count} drafts`, count);
    }

    if (isConversationMode) {
        if (count === 1) {
            return c('Title').t`Delete conversation`;
        }
        return c('Title').ngettext(msgid`Delete ${count} conversation`, `Delete ${count} conversations`, count);
    }

    if (count === 1) {
        return c('Title').t`Delete message`;
    }
    return c('Title').ngettext(msgid`Delete ${count} message`, `Delete ${count} messages`, count);
};

const getModalText = (isDraft: boolean, isConversationMode: boolean, count: number) => {
    if (isDraft) {
        if (count === 1) {
            return c('Info').t`Are you sure you want to permanently delete this draft?`;
        }
        return c('Info').ngettext(
            msgid`Are you sure you want to permanently delete ${count} draft?`,
            `Are you sure you want to permanently delete ${count} drafts?`,
            count
        );
    }

    if (isConversationMode) {
        if (count === 1) {
            return c('Info').t`Are you sure you want to permanently delete this conversation?`;
        }
        return c('Info').ngettext(
            msgid`Are you sure you want to permanently delete ${count} conversation?`,
            `Are you sure you want to permanently delete ${count} conversations?`,
            count
        );
    }

    if (count === 1) {
        return c('Info').t`Are you sure you want to permanently delete this message?`;
    }
    return c('Info').ngettext(
        msgid`Are you sure you want to permanently delete ${count} message?`,
        `Are you sure you want to permanently delete ${count} messages?`,
        count
    );
};

const getNotificationText = (isDraft: boolean, isConversationMode: boolean, count: number) => {
    if (isDraft) {
        if (count === 1) {
            return c('Success').t`Draft deleted`;
        }
        return c('Success').ngettext(msgid`${count} draft deleted`, `${count} drafts deleted`, count);
    }

    if (isConversationMode) {
        if (count === 1) {
            return c('Success').t`Conversation deleted`;
        }
        return c('Success').ngettext(msgid`${count} conversation deleted`, `${count} conversations deleted`, count);
    }

    if (count === 1) {
        return c('Success').t`Message deleted`;
    }
    return c('Success').ngettext(msgid`${count} message deleted`, `${count} messages deleted`, count);
};

const DeleteButton = ({ labelID = '', selectedIDs = [] }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const getElementsFromIDs = useGetElementsFromIDs();
    const count = selectedIDs.length;
    const draft = labelID === DRAFTS || labelID === ALL_DRAFTS;

    const handleDelete = async () => {
        const elements = getElementsFromIDs(selectedIDs);
        const conversationMode = isConversation(elements[0]);

        const modalTitle = getDeleteTitle(draft, conversationMode, count);
        const modalText = getModalText(draft, conversationMode, count);

        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={modalTitle}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="error">{modalText}</Alert>
                </ConfirmModal>
            );
        });

        const action = conversationMode ? deleteConversations(selectedIDs, labelID) : deleteMessages(selectedIDs);
        await api(action);
        await call();

        const notificationText = getNotificationText(draft, conversationMode, count);

        createNotification({ text: notificationText });
    };

    return (
        <ToolbarButton
            loading={loading}
            title={c('Action').t`Delete permanently`}
            onClick={() => withLoading(handleDelete())}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:deletepermanently"
        >
            <Icon className="toolbar-icon mauto" name="delete" />
        </ToolbarButton>
    );
};

export default DeleteButton;
