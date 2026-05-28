import { Box, Button, InlineAlertBox, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldDepositApprovedAmountCard } from '../components/YieldDepositApprovedAmountCard';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStaticStepCard } from '../components/YieldDepositStepCard';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useYieldDepositRevokeScreen } from '../hooks/useYieldDepositRevokeScreen';

export const YieldDepositRevokeScreen = () => {
    const revokeScreen = useYieldDepositRevokeScreen();

    if (revokeScreen === null) {
        return null;
    }

    const {
        account,
        accountLabel,
        apy,
        feeSelectorProps,
        formattedApprovedAmount,
        handleCloseInfoBottomSheet,
        handleReviewAndSign,
        infoBottomSheetRef,
        isApprovedAmountUnlimited,
        isSubmitDisabled,
        isSubmitLoading,
        openInfoBottomSheet,
        pendingBottomSheetRef,
        pendingModal,
        tokenContract,
        tokenSymbol,
        vault,
        vaultTokenName,
    } = revokeScreen;

    const pendingModalAmount = isApprovedAmountUnlimited ? (
        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
    ) : (
        pendingModal?.amount
    );

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box paddingHorizontal="sp16" paddingBottom="sp16">
                        <Button
                            accessibilityRole="button"
                            isDisabled={isSubmitDisabled}
                            isLoading={isSubmitLoading}
                            onPress={handleReviewAndSign}
                        >
                            <Translation id="earn.yieldDepositRevokeScreen.reviewAndSignButton" />
                        </Button>
                    </Box>
                </>
            }
        >
            <Box pointerEvents={pendingModal ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <YieldDepositStaticStepCard
                        title={<Translation id="earn.yieldDepositFlowScreen.revokeApproval" />}
                    />

                    <Box paddingHorizontal="sp16">
                        <InlineAlertBox
                            variant="info"
                            title={
                                <Translation
                                    id="earn.yieldDepositRevokeScreen.infoAlert"
                                    values={{ tokenSymbol }}
                                />
                            }
                        />
                    </Box>

                    <Box paddingHorizontal="sp16">
                        <YieldDepositApprovedAmountCard
                            approvedAmount={formattedApprovedAmount}
                            isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                            networkSymbol={account.symbol}
                            tokenContract={tokenContract}
                        />
                    </Box>

                    {feeSelectorProps && (
                        <Box paddingHorizontal="sp16">
                            <FeeSelector {...feeSelectorProps} />
                        </Box>
                    )}
                </VStack>
            </Box>

            {pendingModal && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingModalAmount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.approvedAmount" />}
                    amountTokenContract={tokenContract}
                    amountTokenSymbol={pendingModal.amountTokenSymbol}
                    fee={pendingModal.fee}
                    isExploreDisabled={pendingModal.isExploreDisabled}
                    onExplorePress={pendingModal.onExplorePress}
                    submittedAt={pendingModal.submittedAt}
                    title={<Translation id="earn.yieldDepositRevokeScreen.pendingTitle" />}
                    vaultName={vault.metadata.name}
                    vaultTokenContract={tokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
        </Screen>
    );
};
