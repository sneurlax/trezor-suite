import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import type { RepoContext } from '../../Requirement';
import {
    findFirmwareReleaseRegressions,
    requireFirmwareReleaseVersionMonotonicity,
} from '../requireFirmwareReleaseVersionMonotonicity';

// The requirement reads firmware files relative to the repo root; this test lives six levels deep.
const REPO_ROOT = resolve(__dirname, '../../../../../..');

type ReleaseFields = {
    readonly version: ReadonlyArray<number>;
    readonly min_firmware_version?: ReadonlyArray<number>;
    readonly min_bootloader_version?: ReadonlyArray<number>;
    readonly bootloader_version?: ReadonlyArray<number>;
};

const createFirmwareDir = (): string => mkdtempSync(join(tmpdir(), 'firmware-releases-'));

const writeRelease = (firmwareDir: string, channelPath: string, release: ReleaseFields): void => {
    const channelDir = join(firmwareDir, channelPath);
    mkdirSync(channelDir, { recursive: true });

    const fileName = `${release.version.join('-')}.json`;
    writeFileSync(join(channelDir, fileName), JSON.stringify(release));
};

describe(requireFirmwareReleaseVersionMonotonicity.name, () => {
    let firmwareDir: string;

    beforeEach(() => {
        firmwareDir = createFirmwareDir();
    });

    afterEach(() => {
        rmSync(firmwareDir, { recursive: true, force: true });
    });

    it('passes when every monotonic field stays equal or increases', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 5],
            min_bootloader_version: [2, 0, 0],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 6],
            min_firmware_version: [2, 0, 8],
            min_bootloader_version: [2, 0, 0],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('reports a field that regresses in a higher version', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 5],
            min_firmware_version: [2, 1, 0],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 6],
            min_firmware_version: [2, 0, 8],
        });

        const regressions = findFirmwareReleaseRegressions(firmwareDir);

        expect(regressions).toHaveLength(1);
        expect(regressions[0]).toContain('min_firmware_version 2.0.8 is lower than 2.1.0');
        expect(regressions[0]).toContain('preceding version 2.1.5');
    });

    it('compares versions numerically regardless of file order', () => {
        // [2, 1, 10] must sort after [2, 1, 9], not lexicographically before it.
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 10],
            min_firmware_version: [2, 0, 8],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 9],
            min_firmware_version: [2, 0, 5],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('ignores an optional field that is absent on either side of a pair', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            bootloader_version: [2, 0, 3],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 1],
            min_firmware_version: [2, 0, 5],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('checks each model and channel independently', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 8],
        });
        writeRelease(firmwareDir, 'tx/bitcoinonly', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 5],
        });
        // A low value in another channel must not be compared against `tx/universal`.
        writeRelease(firmwareDir, 'ty/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 0],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('has repo scope', () => {
        expect(requireFirmwareReleaseVersionMonotonicity.scope).toBe('repo');
    });

    // This test documents a known regression in the upstream firmware metadata mirrored into the
    // repo: T2T1 2.1.6 lowers min_firmware_version from 2.1.0 (2.1.5) to 2.0.8. It is expected to
    // FAIL until the upstream data is corrected. See the accompanying PR / upstream report.
    it('fails on the bundled firmware data until the upstream min_firmware_version regression is fixed', async () => {
        const context: RepoContext = { repoRoot: REPO_ROOT };

        const errors = await requireFirmwareReleaseVersionMonotonicity.verify(context);

        expect(errors).toEqual([]);
    });
});
