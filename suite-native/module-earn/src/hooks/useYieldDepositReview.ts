import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { type YieldReviewActionStatus, type YieldReviewStatus } from '../types';
import { isUserCancelledSignError } from '../utils';
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';

type UseYieldDepositReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
};

type UseYieldDepositReviewResult = {
    depositStatus: YieldReviewStatus;
    handleSubmitDepositReview: () => Promise<void>;
    handleDepositSubmitted: () => Promise<void>;
};

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositReview
>;

export const useYieldDepositReview = ({
    flowData,
    flowKey,
}: UseYieldDepositReviewParams): UseYieldDepositReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const {
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        showSignTransactionFailedAlert,
    } = useShowPushTransactionFailedDuringReviewAlert('yield-deposit');
    const [depositActionStatus, setDepositActionStatus] = useState<YieldReviewActionStatus>('idle');
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    const isDepositSigned = txReview.accountKey === flowData.account.key && !!txReview.serializedTx;
    const depositStatus: YieldReviewStatus =
        depositActionStatus === 'idle' && isDepositSigned ? 'signed' : depositActionStatus;

    const handleSubmitDepositReview = useCallback(async () => {
        if (depositStatus !== 'idle') {
            return;
        }

        setDepositActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                }),
            ),
        );

        setDepositActionStatus('idle');

        if (!deviceAccessResponse.success) {
            showSignTransactionFailedAlert();

            return;
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && !isUserCancelledSignError(signResponse.payload)) {
            showSignTransactionFailedAlert();
        }
    }, [depositStatus, dispatch, flowData, flowKey, showSignTransactionFailedAlert]);

    const handleDepositSubmitted = useCallback(async () => {
        if (depositStatus !== 'signed') {
            return;
        }

        setDepositActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldActionReviewThunk({
                flowData,
                flowKey,
                flowType: 'deposit',
            }),
        );

        setDepositActionStatus('idle');
        const isPushRejected = isRejected(pushResponse);

        if (isPushRejected) {
            if (pushResponse.payload?.error === 'push-transaction-pending-conflict') {
                showPendingTransactionConflictAlert();

                return;
            }

            showPushTransactionFailedAlert();

            return;
        }

        navigation.goBack();
    }, [
        depositStatus,
        dispatch,
        flowData,
        flowKey,
        navigation,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return {
        depositStatus,
        handleSubmitDepositReview,
        handleDepositSubmitted,
    };
};
