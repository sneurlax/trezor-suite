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
        return pendingTransaction.type === 'deposit'
            ? YieldStackRoutes.YieldDeposit
            : YieldStackRoutes.YieldDepositApproval;
    }

    if (allowanceStatus === 'loaded' && allowanceAmount !== null && allowanceAmount !== '0') {
        return YieldStackRoutes.YieldDeposit;
    }

    return YieldStackRoutes.YieldDepositApproval;
};
