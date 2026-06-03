import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Translation } from '@suite-native/intl';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { ExchangeAccountCard } from './ExchangeAccountCard';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type ExchangeFromAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeFromAccountTradePreviewCard = ({
    quote,
}: ExchangeFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const { fromValue } = useChangeStringsExtractor(quote);

    return (
        <ExchangeAccountCard
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />}
            account={fromAccount}
            amount={fromValue}
            direction="from"
            cryptoId={quote?.send}
        />
    );
};
