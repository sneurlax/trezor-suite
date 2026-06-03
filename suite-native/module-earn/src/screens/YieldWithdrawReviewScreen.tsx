import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type FormDraftRootState,
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    type YieldWithdrawInputUnit,
    selectFormDraft,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import {
    type FormState,
    isFinalPrecomposedTransaction,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldReviewList } from '../components/YieldReviewList';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldWithdrawReview } from '../hooks/useYieldWithdrawReview';
import { getYieldWithdrawFormDraftKey } from '../utils/yieldWithdrawUtils';
import { buildYieldDepositFeePreview } from '../yieldDepositFeeUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;

type WithdrawReviewContentProps = {
    fee: string;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    review: {
        amount: string;
    };
    tokenSymbol: string;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

const WithdrawReviewContent = ({
    fee,
    flowData,
    flowKey,
    review,
    tokenSymbol,
    withdrawInputUnit,
}: WithdrawReviewContentProps) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { withdrawStatus, handleSubmitWithdrawReview, handleWithdrawSubmitted } =
        useYieldWithdrawReview({
            flowData,
            flowKey,
            withdrawInputUnit,
        });
    const isSigningWithdraw = withdrawStatus === 'signing';
    const isWithdrawSigned = withdrawStatus === 'signed' || withdrawStatus === 'sending';
    const isSendingWithdraw = withdrawStatus === 'sending';
    const isSubmitDisabled = withdrawStatus !== 'idle';

    const reviewTokenSymbol =
        withdrawInputUnit === 'shares'
            ? tokenSymbol
            : toTokenSymbol(flowData.vault.token.symbol.toUpperCase());

    useEffect(() => {
        if (isSigningWithdraw) {
            revealConfirmOnTrezorSheet();
        } else {
            closeSheet();
        }
    }, [closeSheet, isSigningWithdraw, revealConfirmOnTrezorSheet]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="back"
            defaultHeader={
                <ScreenHeader
                    closeActionType="back"
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.yieldWithdrawReviewScreen.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <YieldReviewList
                    accountKey={flowData.account.key}
                    amount={review.amount}
                    fee={fee}
                    isFooterVisible={!isSigningWithdraw && !isWithdrawSigned}
                    isSubmitDisabled={isSubmitDisabled}
                    isSubmitLoading={isSigningWithdraw}
                    onSubmit={handleSubmitWithdrawReview}
                    tokenSymbol={reviewTokenSymbol}
                    variant="withdraw"
                />
                {isWithdrawSigned && (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="earn.yieldWithdrawReviewScreen.submitButton"
                        isButtonLoading={isSendingWithdraw}
                        messageTranslationId="earn.yieldWithdrawReviewScreen.successMessage"
                        onButtonPress={handleWithdrawSubmitted}
                    />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

export const YieldWithdrawReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { flowData, flowKey, tokenSymbol, resolutionStatus } = useResolvedYieldFlowData(
        route.params,
    );
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'withdraw', flowKey),
    );
    const formDraftKey = flowKey ? getYieldWithdrawFormDraftKey(flowKey) : '';
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const review = session?.action.review;
    const feePreview = useMemo(
        () => (review ? buildYieldDepositFeePreview(review.unsignedTransaction) : null),
        [review],
    );
    const selectedFeePreview = formDraft?.selectedFee
        ? feeLevels[formDraft.selectedFee]
        : undefined;
    const reviewFee = isFinalPrecomposedTransaction(selectedFeePreview)
        ? selectedFeePreview.fee
        : feePreview?.fee;

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, route.params);

            return;
        }

        if (!review || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldWithdraw, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    if (resolutionStatus !== 'resolved' || !review || !feePreview || !reviewFee) {
        return null;
    }

    return (
        <WithdrawReviewContent
            fee={reviewFee}
            flowData={flowData}
            flowKey={flowKey}
            review={review}
            tokenSymbol={tokenSymbol}
            withdrawInputUnit={route.params.withdrawInputUnit ?? 'asset'}
        />
    );
};
