import {
    type YieldAllowanceStatus,
    type YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { YieldStackRoutes } from '@suite-native/navigation';

type GetYieldDepositInitialRouteParams = {
    allowanceAmount: string | null;
    allowanceStatus: YieldAllowanceStatus;
    pendingTransaction: YieldPendingTransactionState | null;
};

export const getYieldDepositInitialRoute = ({
    allowanceAmount,
    allowanceStatus,
    pendingTransaction,
}: GetYieldDepositInitialRouteParams) => {
    if (pendingTransaction) {
        if (pendingTransaction.type === 'deposit') {
            return YieldStackRoutes.YieldDeposit;
        }

        if (pendingTransaction.type === 'revoke' || pendingTransaction.type === 'revoke-only') {
            return YieldStackRoutes.YieldDepositRevoke;
        }

        return YieldStackRoutes.YieldDepositApproval;
    }

    if (allowanceStatus === 'loaded' && allowanceAmount !== null && allowanceAmount !== '0') {
        return YieldStackRoutes.YieldDeposit;
    }

    return YieldStackRoutes.YieldDepositApproval;
};
