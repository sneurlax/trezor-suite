import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const FIRMWARE_DIR = join('packages', 'connect-data', 'files', 'firmware');

// `release/` holds the aggregated release config (releases.v1.json), not per-version firmware files.
const NON_MODEL_DIRS = new Set(['release']);

// Semver-array fields whose value is a floor that must never regress between two consecutive
// firmware versions of the same model and channel. A newer firmware may only raise (or keep)
// these minimums, never lower them, otherwise a device could be offered an update that silently
// relaxes a previously stated requirement.
const MONOTONIC_FIELDS = [
    'min_firmware_version',
    'min_bootloader_version',
    'bootloader_version',
] as const;

type MonotonicField = (typeof MONOTONIC_FIELDS)[number];

type VersionArray = ReadonlyArray<number>;

type FirmwareReleaseFile = {
    readonly version: VersionArray;
} & Partial<Record<MonotonicField, VersionArray>>;

type FirmwareRelease = {
    readonly file: string;
    readonly data: FirmwareReleaseFile;
};

const formatVersion = (version: VersionArray): string => version.join('.');

// Compares two semver arrays element by element, treating a missing position as 0
// (so [2, 1] equals [2, 1, 0]). Returns -1, 0 or 1 like a standard comparator.
const compareVersionArrays = (a: VersionArray, b: VersionArray): number => {
    const length = Math.max(a.length, b.length);

    for (let index = 0; index < length; index++) {
        const diff = (a[index] ?? 0) - (b[index] ?? 0);

        if (diff !== 0) {
            return Math.sign(diff);
        }
    }

    return 0;
};

const readChannelReleases = (channelDir: string): FirmwareRelease[] => {
    const releases: FirmwareRelease[] = [];

    for (const entry of readdirSync(channelDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue;
        }

        const file = join(channelDir, entry.name);
        const data = JSON.parse(readFileSync(file, 'utf-8')) as FirmwareReleaseFile;

        releases.push({ file, data });
    }

    return releases.sort((a, b) => compareVersionArrays(a.data.version, b.data.version));
};

const collectChannelDirs = (firmwareDir: string): string[] => {
    const channelDirs: string[] = [];

    for (const model of readdirSync(firmwareDir, { withFileTypes: true })) {
        if (!model.isDirectory() || NON_MODEL_DIRS.has(model.name)) {
            continue;
        }

        const modelDir = join(firmwareDir, model.name);

        for (const channel of readdirSync(modelDir, { withFileTypes: true })) {
            if (channel.isDirectory()) {
                channelDirs.push(join(modelDir, channel.name));
            }
        }
    }

    return channelDirs;
};

/**
 * Walks every model/channel sequence of firmware releases (sorted by `version`) and reports any
 * monotonic field whose value is lower than in the immediately preceding release.
 *
 * Exported separately from the requirement so it can be unit tested against synthetic fixtures.
 */
export const findFirmwareReleaseRegressions = (firmwareDir: string): string[] => {
    const errors: string[] = [];

    for (const channelDir of collectChannelDirs(firmwareDir)) {
        const releases = readChannelReleases(channelDir);

        for (let index = 1; index < releases.length; index++) {
            const previous = releases[index - 1];
            const current = releases[index];

            if (previous === undefined || current === undefined) {
                continue;
            }

            for (const field of MONOTONIC_FIELDS) {
                const previousValue = previous.data[field];
                const currentValue = current.data[field];

                if (previousValue === undefined || currentValue === undefined) {
                    continue;
                }

                if (compareVersionArrays(currentValue, previousValue) < 0) {
                    errors.push(
                        `${current.file}: ${field} ${formatVersion(currentValue)} is lower than ` +
                            `${formatVersion(previousValue)} in preceding version ${formatVersion(
                                previous.data.version,
                            )}`,
                    );
                }
            }
        }
    }

    return errors;
};

/**
 * Verifies that firmware release metadata never regresses: for each model and channel, a higher
 * firmware version must carry version floors (`min_firmware_version`, `min_bootloader_version`,
 * `bootloader_version`) greater than or equal to the immediately preceding version.
 *
 * NOTE: The firmware metadata mirrored from upstream (data.trezor.io) currently violates this
 * requirement — T2T1 2.1.6 lowers `min_firmware_version` from 2.1.0 to 2.0.8 — so the blocking
 * `requirements:verify` gate fails until the upstream data is corrected. The PR that introduced
 * this requirement is intentionally held until then.
 */
export const requireFirmwareReleaseVersionMonotonicity: Requirement<'repo'> = {
    name: 'firmware-release-version-monotonicity',
    scope: 'repo',
    verify: ({ repoRoot }) =>
        Promise.resolve(findFirmwareReleaseRegressions(join(repoRoot, FIRMWARE_DIR))),
};
