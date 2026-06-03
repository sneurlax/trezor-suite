import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    type FeesRootState,
    type FormDraftRootState,
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    type YieldWithdrawInputUnit,
    buildEvmSelectedFee,
    selectConvertedNetworkFeeInfo,
    selectFormDraft,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import { type EvmSelectedFee, type FormState } from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { type YieldReviewActionStatus, type YieldReviewStatus } from '../types';
import { isUserCancelledSignError } from '../utils';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import {
    getYieldWithdrawFormDraftKey,
    getYieldWithdrawInputToken,
} from '../utils/yieldWithdrawUtils';
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';

type UseYieldWithdrawReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

type UseYieldWithdrawReviewResult = {
    handleSubmitWithdrawReview: () => Promise<void>;
    handleWithdrawSubmitted: () => Promise<void>;
    withdrawStatus: YieldReviewStatus;
};

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;

const getSelectedEvmFee = (
    formDraft: FormState | undefined,
    feeInfo: ReturnType<typeof selectConvertedNetworkFeeInfo>,
): EvmSelectedFee | null => {
    if (!formDraft?.feeLimit) {
        return null;
    }

    const referenceLevelLabel =
        formDraft.selectedFee === 'custom' ? 'normal' : (formDraft.selectedFee ?? 'normal');
    const selectedFeeInfo = feeInfo?.levels.find(level => level.label === referenceLevelLabel);
    const maxFeePerGas = formDraft.maxFeePerGas ?? selectedFeeInfo?.maxFeePerGas;
    const maxPriorityFeePerGas =
        formDraft.maxPriorityFeePerGas ?? selectedFeeInfo?.maxPriorityFeePerGas;

    if (maxFeePerGas && maxPriorityFeePerGas && selectedFeeInfo?.baseFeePerGas) {
        return buildEvmSelectedFee({
            feeLevel: {
                feePerUnit: formDraft.feePerUnit ?? selectedFeeInfo.feePerUnit,
                maxFeePerGas,
                maxPriorityFeePerGas,
                baseFeePerGas: selectedFeeInfo.baseFeePerGas,
            },
            gasLimit: formDraft.feeLimit,
        });
    }

    const gasPrice = formDraft.feePerUnit ?? selectedFeeInfo?.feePerUnit;

    if (gasPrice) {
        return buildEvmSelectedFee({
            feeLevel: { feePerUnit: gasPrice },
            gasLimit: formDraft.feeLimit,
        });
    }

    return null;
};

export const useYieldWithdrawReview = ({
    flowData,
    flowKey,
    withdrawInputUnit,
}: UseYieldWithdrawReviewParams): UseYieldWithdrawReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const {
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        showSignTransactionFailedAlert,
    } = useShowPushTransactionFailedDuringReviewAlert('yield-withdraw');
    const [withdrawActionStatus, setWithdrawActionStatus] =
        useState<YieldReviewActionStatus>('idle');
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    const formDraftKey = getYieldWithdrawFormDraftKey(flowKey);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectFormDraft<FormState>(state, formDraftKey),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, flowData.account.symbol),
    );
    const selectedFee = useMemo(() => getSelectedEvmFee(formDraft, feeInfo), [feeInfo, formDraft]);
    const isWithdrawSigned =
        txReview.accountKey === flowData.account.key && !!txReview.serializedTx;
    const withdrawStatus: YieldReviewStatus =
        withdrawActionStatus === 'idle' && isWithdrawSigned ? 'signed' : withdrawActionStatus;
    const reviewToken = getYieldWithdrawInputToken({ flowData, withdrawInputUnit });

    const handleSubmitWithdrawReview = useCallback(async () => {
        if (withdrawStatus !== 'idle') {
            return;
        }

        setWithdrawActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType: 'withdraw',
                    reviewToken,
                    selectedFee,
                }),
            ),
        );

        setWithdrawActionStatus('idle');

        if (!deviceAccessResponse.success) {
            showSignTransactionFailedAlert();

            return;
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && !isUserCancelledSignError(signResponse.payload)) {
            showSignTransactionFailedAlert();
        }
    }, [
        dispatch,
        flowData,
        flowKey,
        reviewToken,
        selectedFee,
        showSignTransactionFailedAlert,
        withdrawStatus,
    ]);

    const handleWithdrawSubmitted = useCallback(async () => {
        if (withdrawStatus !== 'signed') {
            return;
        }

        setWithdrawActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldActionReviewThunk({
                flowData,
                flowKey,
                flowType: 'withdraw',
            }),
        );

        setWithdrawActionStatus('idle');
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
        dispatch,
        flowData,
        flowKey,
        navigation,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        withdrawStatus,
    ]);

    return {
        handleSubmitWithdrawReview,
        handleWithdrawSubmitted,
        withdrawStatus,
    };
};
