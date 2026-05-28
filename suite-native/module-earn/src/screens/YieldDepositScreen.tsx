import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getNetwork, getNetworkType } from '@suite-common/wallet-config';
import { getYieldApprovalAction, stablecoinYieldActions } from '@suite-common/wallet-core';
import { Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { YieldDepositAmountInputCard } from '../components/YieldDepositAmountInputCard';
import { YieldDepositApprovedAmountCard } from '../components/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../components/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../components/YieldDepositStepCard';
import { YieldDepositTxSimulationBottomSheet } from '../components/YieldDepositTxSimulationBottomSheet';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useRefreshYieldDepositAllowanceOnIdle } from '../hooks/useRefreshYieldDepositAllowanceOnIdle';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { type PreparedYieldDepositAction, useYieldDepositFees } from '../hooks/useYieldDepositFees';
import { useYieldDepositForm } from '../hooks/useYieldDepositForm';
import { useYieldDepositSubmit } from '../hooks/useYieldDepositSubmit';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { isYieldApprovalAllowanceUnlimited } from '../yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDeposit>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDeposit>;

export const YieldDepositScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { CryptoAmountFormatter } = useFormatters();

    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const [simulationPreparedAction, setSimulationPreparedAction] =
        useState<PreparedYieldDepositAction | null>(null);

    const resolvedFlowData = useResolvedYieldFlowData(route.params);
    const {
        account,
        apy,
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenName,
        resolutionStatus,
    } = resolvedFlowData;

    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
    });
    const depositAmount = session?.action.amount;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: actionPendingTransaction,
        reopenPendingBottomSheet,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'deposit',
    });
    const isDepositPending = !!actionPendingTransaction;
    const isActionSubmitting = session?.action.isSubmitting ?? false;
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const canEditApproval = !!allowanceAmount && allowanceAmount !== '0';
    const isAllowanceLoaded = allowanceStatus === 'loaded';
    const isDepositSessionReady = session?.step === 'action';
    const depositForm = useYieldDepositForm({
        defaultAmount: depositAmount,
        token,
        tokenSymbol,
    });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = depositForm;
    const {
        formState: { isValid },
    } = form;

    const approvalAction = getYieldApprovalAction({
        liveAmount: amountValue ?? '',
        allowanceAmount,
        isModifyMode: true,
        isRevokeRequired: session?.approval.isRevokeRequired ?? false,
        tokenContractAddress: token?.contractAddress,
    });
    const isDepositAmountReady = isValid && !!amountValue;
    const isApprovalActionRequired =
        !!amountValue && isAllowanceLoaded && approvalAction !== 'continue';

    const canContinueDepositFlow =
        isDepositSessionReady &&
        isAllowanceLoaded &&
        isDepositAmountReady &&
        !isDepositPending &&
        !isActionSubmitting;
    const canPrepareDepositFee = canContinueDepositFlow && !isApprovalActionRequired;
    const isSubmitDisabled = !canContinueDepositFlow;

    const depositFee = useYieldDepositFees({
        amount: amountValue,
        flowData,
        flowKey,
        isEnabled: canPrepareDepositFee,
    });
    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'deposit',
        isEnabled: isFocused,
    });

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        pendingTransaction: actionPendingTransaction,
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        resolvedFlowData,
    });

    useEffect(() => {
        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);
        }
    }, [navigation, route.params, session?.step]);

    const formattedApprovedAmount = useMemo(() => {
        if (!allowanceAmount || !tokenSymbol || isApprovedAmountUnlimited) {
            return null;
        }

        return CryptoAmountFormatter.format(allowanceAmount, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [CryptoAmountFormatter, isApprovedAmountUnlimited, allowanceAmount, tokenSymbol]);

    const handleNavigateToApproval = useCallback(() => {
        if (!flowKey || isDepositPending) {
            return;
        }

        dispatch(
            stablecoinYieldActions.enterModifyMode({
                flowType: 'deposit',
                flowKey,
                amount: amountValue || undefined,
            }),
        );
        navigation.navigate(YieldStackRoutes.YieldDepositApproval, route.params);
    }, [amountValue, dispatch, flowKey, isDepositPending, navigation, route.params]);

    const handleNavigateToRevoke = useCallback(
        (amount?: string) => {
            if (!flowKey || isDepositPending) {
                return;
            }

            navigation.navigate(YieldStackRoutes.YieldDepositRevoke, {
                ...route.params,
                amount,
            });
        },
        [flowKey, isDepositPending, navigation, route.params],
    );

    const handleEditApproval = useCallback(() => {
        handleNavigateToRevoke(amountValue || undefined);
    }, [amountValue, handleNavigateToRevoke]);

    const handleApprovalAction = useCallback(() => {
        if (approvalAction === 'revoke') {
            handleNavigateToRevoke(amountValue);

            return;
        }

        handleNavigateToApproval();
    }, [amountValue, approvalAction, handleNavigateToApproval, handleNavigateToRevoke]);
    const handleActionReady = useCallback(
        (preparedAction: PreparedYieldDepositAction) => {
            setSimulationPreparedAction(preparedAction);
            requestAnimationFrame(openSimulationBottomSheet);
        },
        [openSimulationBottomSheet],
    );
    const handleConfirmSimulation = useCallback(() => {
        if (!flowKey || !simulationPreparedAction) {
            return;
        }

        dispatch(
            stablecoinYieldActions.storeActionReviewData({
                amount: simulationPreparedAction.amount,
                flowKey,
                flowType: 'deposit',
                receiptAmount: simulationPreparedAction.receiptAmount,
                unsignedTransaction: simulationPreparedAction.unsignedTransaction,
            }),
        );
        closeSimulationBottomSheet();
        navigation.navigate(YieldStackRoutes.YieldDepositReview, route.params);
    }, [
        closeSimulationBottomSheet,
        dispatch,
        flowKey,
        navigation,
        route.params,
        simulationPreparedAction,
    ]);
    const { handleSubmitDeposit } = useYieldDepositSubmit({
        amount: amountValue,
        flowData,
        flowKey,
        onActionReady: handleActionReady,
        onApprovalRequired: handleNavigateToApproval,
        onRevokeRequired: () => handleNavigateToRevoke(amountValue),
        preparedAction: depositFee.preparedAction,
    });

    const handleContinue = useCallback(() => {
        if (!canContinueDepositFlow) {
            return;
        }

        if (isApprovalActionRequired) {
            handleApprovalAction();

            return;
        }

        void handleSubmitDeposit();
    }, [
        canContinueDepositFlow,
        handleApprovalAction,
        handleSubmitDeposit,
        isApprovalActionRequired,
    ]);
    const footerTranslationId = (() => {
        if (!isApprovalActionRequired) {
            return undefined;
        }

        if (approvalAction === 'revoke') {
            return 'earn.yieldDepositFlowScreen.revokeApproval';
        }

        return 'earn.yieldDepositFlowScreen.increaseApprovalLimit';
    })();

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();
        reopenPendingBottomSheet();
    }, [closeInfoBottomSheet, reopenPendingBottomSheet]);
    const handleCloseDeposit = useCallback(() => {
        navigateToInitialScreen();

        if (!flowKey || session?.action.pendingTransaction) {
            return;
        }

        dispatch(stablecoinYieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, navigateToInitialScreen, session?.action.pendingTransaction]);

    if (resolutionStatus !== 'resolved' || !isDepositSessionReady) {
        return null;
    }

    const networkType = getNetworkType(account.symbol);
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleCloseDeposit}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    buttonTranslationId={footerTranslationId}
                    isDisabled={isSubmitDisabled}
                    isLoading={isActionSubmitting}
                    onPress={handleContinue}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Box pointerEvents={isDepositPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <YieldDepositStepCard currentStepIndex={1} />

                    <Box paddingHorizontal="sp16">
                        <YieldDepositApprovedAmountCard
                            approvedAmount={formattedApprovedAmount}
                            isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                            networkSymbol={account.symbol}
                            onEditApprovalPress={canEditApproval ? handleEditApproval : undefined}
                            tokenContract={route.params.tokenContract}
                        />
                    </Box>

                    <Box paddingHorizontal="sp16">
                        <Form form={form}>
                            <YieldDepositAmountInputCard
                                balance={token.balance}
                                isMaxSelected={isMaxSelected}
                                onAmountChange={handleAmountChange}
                                onMaxChange={handleMaxChange}
                                tokenSymbol={tokenSymbol}
                            />
                        </Form>
                    </Box>

                    {isValid && !!amountValue && !isApprovalActionRequired && (
                        <Box paddingHorizontal="sp16">
                            <FeeSummaryCard
                                fee={depositFee.feePreview?.fee ?? null}
                                symbol={account.symbol}
                                networkType={networkType}
                                areFeesLoading={depositFee.isPreparingDepositFee}
                                testID="@earn/yield-deposit-fee-preview-card"
                            />
                        </Box>
                    )}
                </VStack>
            </Box>

            {actionPendingTransaction && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={actionPendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />}
                    amountTokenContract={route.params.tokenContract}
                    amountTokenSymbol={tokenSymbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    title={<Translation id="earn.yieldDepositFlowScreen.depositPendingTitle" />}
                    vaultName={vault.metadata.name}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
            {simulationPreparedAction && (
                <YieldDepositTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    onCancel={closeSimulationBottomSheet}
                    onConfirm={handleConfirmSimulation}
                    preparedAction={simulationPreparedAction}
                />
            )}
        </Screen>
    );
};
