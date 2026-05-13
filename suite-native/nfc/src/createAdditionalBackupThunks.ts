import {
    selectIsAdditionalShamirBackupInProgress,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect, { type OkWithDevice, PROTO } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Err } from '@trezor/type-utils';

const CREATE_ADDITIONAL_BACKUP_MODULE_PREFIX = 'createAdditionalBackup';

export const createAdditionalBackupThunk = createThunk<
    Err<SerializedError> | OkWithDevice<PROTO.Success>,
    void,
    { rejectValue: string }
>(
    `${CREATE_ADDITIONAL_BACKUP_MODULE_PREFIX}/createAdditionalBackup`,
    async (_, { getState, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (!device?.features) {
            return rejectWithValue('Device not found');
        }

        const isAlreadyInBackupMode = selectIsAdditionalShamirBackupInProgress(getState());

        const mutexResponse = await requestPrioritizedDeviceAccess(async () => {
            if (!isAlreadyInBackupMode) {
                const unlockResponse = await TrezorConnect.recoveryDevice({
                    type: 'UnlockRepeatedBackup',
                    input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
                    enforce_wordlist: true,
                    device: {
                        path: device.path,
                    },
                });

                if (!unlockResponse.success) {
                    return unlockResponse;
                }
            }

            return TrezorConnect.backupDevice({
                backup_method: PROTO.BackupMethod.N4W1,
                device: {
                    path: device.path,
                },
            });
        });

        if (!mutexResponse.success) {
            return rejectWithValue(mutexResponse.error);
        }

        return mutexResponse.payload;
    },
);
