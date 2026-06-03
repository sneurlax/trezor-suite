import type { ReactNode } from 'react';

import type { CryptoId } from 'invity-api';

import type { Account } from '@suite-common/wallet-types';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoAmountRow } from '../../general/CryptoAmountRow';

export type ExchangeAccountCardProps = {
    account: Account | undefined;
    title: ReactNode;
    amount: string | undefined;
    direction: 'from' | 'to';
    cryptoId: CryptoId | undefined;
};

const rowStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
    borderTopColor: utils.colors.borderNeutral,
    borderTopWidth: 1,
}));

export const ExchangeAccountCard = ({
    account,
    title,
    amount,
    direction,
    cryptoId,
}: ExchangeAccountCardProps) => {
    const { applyStyle } = useNativeStyles();

    if (!account) {
        return null;
    }

    return (
        <NetworkAndAccountCard title={title} account={account}>
            <CryptoAmountRow
                cryptoId={cryptoId}
                amount={amount}
                direction={direction}
                style={applyStyle(rowStyle)}
            />
        </NetworkAndAccountCard>
    );
};
