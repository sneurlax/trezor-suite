/* eslint-disable no-console */
import { type Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { type DelegatedIdentityKey, type TrezorDeviceWithState } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import { DEFAULT_DEVICE_SIZE_QUOTA } from './constants';
import { quotaManagerDeviceFetched, quotaManagerFetchError } from './quotaManagerActions';
import { selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { checkStorageByPublicKey } from './storage/checkStorage';
import { registerStorageThunk } from './storage/registerStorageThunk';
import { prepareMessageBufferEvoluSignRegistrationRequest } from './util/prepareMessageBufferEvoluSignRegistrationRequest';

const EVOLU_SIGN_REGISTRATION_REQUEST_HEADER = 'EvoluSignRegistrationRequest';

type EnsureDeviceHasQuotaParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

export const ensureDeviceHasQuotaThunk =
    ({ device, delegatedKey }: EnsureDeviceHasQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        const quotaManagerBaseUrl = selectQuotaManagerBaseUrl(getState());

        const delegatedKeyPublic = getPublicIdentityKeyFromDelegatedKey(delegatedKey);

        console.error(
            `[SuiteSync] ensureDeviceQuota START deviceId=${device.id} quotaManagerBaseUrl=${quotaManagerBaseUrl}`,
        );

        const hasPublicKeyStorage = await checkStorageByPublicKey({
            baseUrl: quotaManagerBaseUrl,
            publicKey: delegatedKeyPublic,
        });

        if (!hasPublicKeyStorage.success) {
            console.error(
                `[SuiteSync] ensureDeviceQuota: checkStorageByPublicKey failed type=${hasPublicKeyStorage.error.type} message=${hasPublicKeyStorage.error.message}`,
            );
            dispatch(quotaManagerFetchError({ error: hasPublicKeyStorage.error.message }));

            return;
        }

        console.error(
            `[SuiteSync] ensureDeviceQuota: checkStorageByPublicKey status=${hasPublicKeyStorage.payload.status}`,
        );

        // already registered, don't need to register again
        if (hasPublicKeyStorage.payload.status === 'Allocated') {
            console.error(
                `[SuiteSync] ensureDeviceQuota: device already registered totalSpace=${hasPublicKeyStorage.payload.totalSpace} unspentSpace=${hasPublicKeyStorage.payload.unspentSpace}`,
            );
            dispatch(
                quotaManagerDeviceFetched({
                    deviceId: device.id,
                    totalStorageSize: hasPublicKeyStorage.payload.totalSpace,
                    unspentStorageSize: hasPublicKeyStorage.payload.unspentSpace,
                }),
            );

            return;
        }

        console.error('[SuiteSync] ensureDeviceQuota: device not registered, fetching challenge');
        const sessionChallenge = await prepareChallengeSession({
            baseUrl: quotaManagerBaseUrl,
        });

        if (!sessionChallenge.success) {
            console.error(
                `[SuiteSync] ensureDeviceQuota: challenge failed message=${sessionChallenge.error.message}`,
            );
            dispatch(quotaManagerFetchError({ error: sessionChallenge.error.message }));

            return;
        }

        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: EVOLU_SIGN_REGISTRATION_REQUEST_HEADER,
            appendMessageBuffer: prepareMessageBufferEvoluSignRegistrationRequest({
                challenge: sessionChallenge.payload.challenge,
                size: DEFAULT_DEVICE_SIZE_QUOTA,
            }),
        });

        if (!proofOfDelegatedIdentity.success) {
            console.error('[SuiteSync] ensureDeviceQuota: proof of delegated identity failed');

            return;
        }

        console.error(
            '[SuiteSync] ensureDeviceQuota: calling TrezorConnect.evoluSignRegistrationRequest',
        );
        const registrationRequestResult = await TrezorConnect.evoluSignRegistrationRequest({
            challenge_from_server: sessionChallenge.payload.challenge,
            size_to_acquire: DEFAULT_DEVICE_SIZE_QUOTA,
            proof_of_delegated_identity: proofOfDelegatedIdentity.payload,
        });

        console.error(
            `[SuiteSync] ensureDeviceQuota: evoluSignRegistrationRequest success=${registrationRequestResult.success}`,
        );

        if (registrationRequestResult.success) {
            dispatch(
                registerStorageThunk({
                    size: DEFAULT_DEVICE_SIZE_QUOTA,
                    certificateChain: {
                        deviceCert: registrationRequestResult.payload.certificate_chain[0],
                        caCert: registrationRequestResult.payload.certificate_chain[1],
                    },
                    challenge: sessionChallenge.payload.challenge,
                    proof: registrationRequestResult.payload.signature,
                    sessionId: sessionChallenge.payload.sessionId,
                    deviceModel: device.features.internal_model,
                    publicKey: delegatedKeyPublic,
                }),
            );
        }
    };
