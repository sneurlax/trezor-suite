import { selectIsNfcBackupEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const NfcBackup = () => {
    const isNfcBackupEnabled = useSelector(selectIsNfcBackupEnabled);
    const dispatch = useDispatch();

    const toggle = () =>
        dispatch(suiteSettingsActions.setDebugMode({ isNfcBackupEnabled: !isNfcBackupEnabled }));

    return (
        <SectionItem>
            <TextColumn
                title="NFC Backup"
                description="Enable Trezor device NFC backup features."
            />
            <ActionColumn>
                <Switch isChecked={isNfcBackupEnabled} onChange={toggle} />
            </ActionColumn>
        </SectionItem>
    );
};
