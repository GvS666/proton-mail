import React, { useState, useEffect, ReactNode, MouseEvent, useMemo, useCallback, memo } from 'react';

import { useFolders } from 'react-components';
import { buildTreeview } from 'proton-shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import { setItem, getItem } from 'proton-shared/lib/helpers/storage';

import SidebarFolder from './SidebarFolder';
import EmptyFolders from './EmptyFolders';
import { UnreadCounts } from './MailSidebarList';

interface Props {
    currentLabelID: string;
    counterMap: UnreadCounts;
}

const formatFolderID = (folderID: string): string => `folder_expanded_state_${folderID}`;

const SidebarFolders = ({ currentLabelID, counterMap }: Props) => {
    const [folders, loadingFolders] = useFolders();
    const [foldersUI, setFoldersUI] = useState<Folder[]>([]);
    const treeview = useMemo(() => buildTreeview(foldersUI) as FolderWithSubFolders[], [foldersUI]);

    useEffect(() => {
        if (Array.isArray(folders)) {
            setFoldersUI(
                folders.map((folder) => ({
                    ...folder,
                    Expanded: getItem(formatFolderID(folder.ID)) === '0' ? 0 : 1,
                }))
            );
        }
    }, [loadingFolders, folders]);

    const handleToggleFolder = useCallback(
        (event: MouseEvent, folder: Folder) => {
            event.stopPropagation();
            event.preventDefault();

            const newExpanded = getItem(formatFolderID(folder.ID)) === '0' ? 1 : 0;

            // Update view
            setFoldersUI(
                foldersUI.map((folderItem: Folder) => {
                    if (folderItem.ID === folder.ID) {
                        return {
                            ...folderItem,
                            Expanded: newExpanded,
                        };
                    }
                    return folderItem;
                })
            );

            // Save expanded state locally
            setItem(formatFolderID(folder.ID), `${newExpanded}`);
        },
        [foldersUI]
    );

    const treeviewReducer = (acc: ReactNode[], folder: FolderWithSubFolders, level = 0): any[] => {
        acc.push(
            <SidebarFolder
                key={folder.ID}
                currentLabelID={currentLabelID}
                folder={folder}
                level={level}
                onToggle={handleToggleFolder}
                unreadCount={counterMap[folder.ID]}
            />
        );

        if (folder.Expanded && Array.isArray(folder.subfolders) && folder.subfolders.length) {
            folder.subfolders.forEach((folder: FolderWithSubFolders) => treeviewReducer(acc, folder, level + 1));
        }

        return acc;
    };

    return !loadingFolders && !folders?.length ? (
        <EmptyFolders />
    ) : (
        <>{treeview.reduce((acc, folder: FolderWithSubFolders) => treeviewReducer(acc, folder), [] as ReactNode[])}</>
    );
};

export default memo(SidebarFolders);
