import { type PROTO } from '@trezor/connect';

export const EXTENDABLE_SHAMIR_BACKUP_TYPES: PROTO.BackupType[] = [
    'Slip39_Single_Extendable',
    'Slip39_Basic_Extendable',
    'Slip39_Advanced_Extendable',
];

export const hasExtendableShamirBackup = (features: PROTO.Features): boolean =>
    features.backup_type != null && EXTENDABLE_SHAMIR_BACKUP_TYPES.includes(features.backup_type);

export const doesSupportMultiShare = (features: PROTO.Features): boolean =>
    features.capabilities?.includes('Capability_Shamir') === true &&
    hasExtendableShamirBackup(features);

export const isAdditionalShamirBackupInProgress = (features: PROTO.Features): boolean =>
    features.recovery_status === 'Backup' &&
    features.recovery_type === undefined &&
    features.backup_availability === 'Available';
