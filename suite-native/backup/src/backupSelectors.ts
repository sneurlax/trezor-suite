import {
    type DeviceRootState,
    selectDeviceFeatures,
    selectDeviceModel,
} from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EXTENDABLE_SHAMIR_BACKUP_TYPES } from './backupConstants';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectIsAdditionalShamirBackupInProgress = createMemoizedSelector(
    [selectDeviceFeatures],
    features =>
        features?.recovery_status === 'Backup' &&
        features.recovery_type === undefined &&
        features.backup_availability === 'Available',
);

export const selectHasExtendableShamirBackup = createMemoizedSelector(
    [selectDeviceFeatures],
    features =>
        features?.backup_type !== undefined &&
        features?.backup_type !== null &&
        EXTENDABLE_SHAMIR_BACKUP_TYPES.includes(features.backup_type),
);

export const selectIsCreateAdditionalBackupAvailable = createMemoizedSelector(
    [selectDeviceModel, selectHasExtendableShamirBackup, selectDeviceFeatures],
    (deviceModel, hasExtendableShamirBackup, features) =>
        deviceModel === DeviceModelInternal.T3W1 && // NOTE: FW will expose a capability flag for this, so it should be replaced with that than
        hasExtendableShamirBackup &&
        features?.backup_availability === 'NotAvailable',
);
