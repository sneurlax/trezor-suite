import { type ReactNode } from 'react';

import { type Account, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { Card, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon, Icon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const detailsRowStyle = prepareNativeStyle<{ isFirst: boolean }>((utils, { isFirst }) => ({
    alignItems: 'center',
    borderTopColor: utils.colors.borderNeutral,
    borderTopWidth: isFirst ? 0 : utils.borders.widths.small,
    justifyContent: 'space-between',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
}));

const detailsRowValueStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
}));

const detailsRowValueTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
}));

type YieldDepositRevokeDetailsRowProps = {
    children: ReactNode;
    isFirst?: boolean;
    label: ReactNode;
};

const YieldDepositRevokeDetailsRow = ({
    children,
    isFirst = false,
    label,
}: YieldDepositRevokeDetailsRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack style={applyStyle(detailsRowStyle, { isFirst })}>
            <Text variant="body-sm">{label}</Text>
            {children}
        </HStack>
    );
};

type YieldDepositRevokeLimitValueProps = {
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    networkSymbol: Account['symbol'];
    tokenContract: TokenAddress;
    tokenSymbol: TokenSymbol;
};

const YieldDepositRevokeLimitValue = ({
    approvedAmount,
    isApprovedAmountUnlimited,
    networkSymbol,
    tokenContract,
    tokenSymbol,
}: YieldDepositRevokeLimitValueProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack
            alignItems="center"
            flexShrink={1}
            spacing="sp4"
            style={applyStyle(detailsRowValueStyle)}
        >
            <CryptoIcon symbol={networkSymbol} contractAddress={tokenContract} size="extraSmall" />
            <Text
                color="contentPrimary"
                ellipsizeMode="tail"
                numberOfLines={1}
                style={applyStyle(detailsRowValueTextStyle)}
                variant="body-sm-strong"
            >
                {isApprovedAmountUnlimited ? (
                    <>
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />{' '}
                        {tokenSymbol}
                    </>
                ) : (
                    approvedAmount
                )}
            </Text>
            <Icon name="arrowRight" size="medium" color="contentSecondary" />
            <Text color="contentPrimary" variant="body-sm-strong">
                0 {tokenSymbol}
            </Text>
        </HStack>
    );
};

type YieldDepositRevokeDetailsCardProps = {
    account: Account;
    accountLabel: string;
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    providerName: string;
    tokenContract: TokenAddress;
    tokenSymbol: TokenSymbol;
};

export const YieldDepositRevokeDetailsCard = ({
    account,
    accountLabel,
    approvedAmount,
    isApprovedAmountUnlimited,
    providerName,
    tokenContract,
    tokenSymbol,
}: YieldDepositRevokeDetailsCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card noPadding>
            <YieldDepositRevokeDetailsRow
                isFirst
                label={<Translation id="earn.yieldDepositRevokeScreen.account" />}
            >
                <HStack
                    alignItems="center"
                    spacing="sp8"
                    flexShrink={1}
                    style={applyStyle(detailsRowValueStyle)}
                >
                    <NetworkIcon symbol={account.symbol} size={20} />
                    <Text
                        color="contentPrimary"
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        style={applyStyle(detailsRowValueTextStyle)}
                        variant="body-sm"
                    >
                        {accountLabel}
                    </Text>
                </HStack>
            </YieldDepositRevokeDetailsRow>

            <YieldDepositRevokeDetailsRow
                label={<Translation id="earn.yieldDepositRevokeScreen.provider" />}
            >
                <Text
                    color="contentPrimary"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(detailsRowValueTextStyle)}
                    variant="body-sm"
                >
                    {providerName}
                </Text>
            </YieldDepositRevokeDetailsRow>

            <YieldDepositRevokeDetailsRow
                label={<Translation id="earn.yieldDepositRevokeScreen.limit" />}
            >
                <YieldDepositRevokeLimitValue
                    approvedAmount={approvedAmount}
                    isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                    networkSymbol={account.symbol}
                    tokenContract={tokenContract}
                    tokenSymbol={tokenSymbol}
                />
            </YieldDepositRevokeDetailsRow>
        </Card>
    );
};
