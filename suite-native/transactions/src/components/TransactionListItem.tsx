import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    createTargets,
    selectAccountByKey,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTxStakeType } from '@suite-common/wallet-utils';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListItemContainer } from './TransactionListItemContainer';
import { TransactionTarget } from './TransactionTarget';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TransactionListItem = ({
    transaction,
    accountKey,
    isFirst = false,
    isLast = false,
}: TransactionListItemProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { isPhishing: isPhishingTransaction } = useSelector(
        (
            state: TokenDefinitionsRootState &
                TransactionsRootState &
                FiatRatesRootState &
                PhishingRootState,
        ) => selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const includedCoinsCount = transaction.tokens.length;

    const firstToken = transaction.tokens[0];
    const isTokenOnlyTransaction = transaction.amount === '0' && firstToken !== undefined;

    const allOutputs = account !== null ? createTargets({ transaction, account }) : [];

    if (isTokenOnlyTransaction)
        return (
            <TokenTransferListItem
                transaction={transaction}
                accountKey={accountKey}
                tokenTransfer={firstToken}
                includedCoinsCount={transaction.tokens.length - 1}
                isFirst={isFirst}
                isLast={isLast}
            />
        );

    const stakeOperationType = getTxStakeType(transaction);

    return (
        <TransactionListItemContainer
            transaction={transaction}
            transactionType={transaction.type}
            stakeOperationType={stakeOperationType}
            accountKey={accountKey}
            includedCoinsCount={includedCoinsCount}
            isFirst={isFirst}
            isLast={isLast}
        >
            {allOutputs.map((target, i) => (
                <TransactionTarget
                    key={i}
                    accountKey={accountKey}
                    isPhishingTransaction={isPhishingTransaction}
                    transaction={transaction}
                    {...target}
                />
            ))}
        </TransactionListItemContainer>
    );
};

TransactionListItem.displayName = 'TransactionListItem';
