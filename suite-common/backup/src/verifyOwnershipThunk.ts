import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { type DeviceUniquePath, PROTO } from '@trezor/connect';

const actionPrefix = '@common/backup';

export const verifyOwnershipThunk = createThunk(
    `${actionPrefix}/verifyOwnership`,
    async ({ devicePath }: { devicePath: DeviceUniquePath }) => {
        const response = await TrezorConnect.recoveryDevice({
            type: 'UnlockRepeatedBackup',
            input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
            enforce_wordlist: true,
            device: { path: devicePath },
        });

        return response.success;
    },
);
