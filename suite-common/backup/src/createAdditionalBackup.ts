import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { type DeviceUniquePath, type PROTO } from '@trezor/connect';

const actionPrefix = '@common/backup';

export const createAdditionalBackupThunk = createThunk(
    `${actionPrefix}/createAdditionalBackup`,
    async ({
        devicePath,
        backupMethod,
    }: {
        devicePath: DeviceUniquePath;
        backupMethod: PROTO.BackupMethod;
    }) => {
        const response = await TrezorConnect.backupDevice({
            backup_method: backupMethod,
            device: { path: devicePath },
        });

        return response.success;
    },
);
