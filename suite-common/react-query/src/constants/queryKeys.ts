import type { AllowedQueryKey } from '../types';

export const commonQueryKeys = {
    networkTxSimulation: (input?: unknown) => ['network-tx-simulation', input],
    supplyTxSimulation: (input?: unknown) => ['tx-simulation-supply', input],
    dappScan: (url?: string) => ['dapp-scan', url],
    validatorsQueue: (accountKey: string, timestamp?: number) => [
        'everstake',
        'validatorsQueue',
        accountKey,
        timestamp ?? 'no-ts',
    ],
    solanaRewards: (...args: unknown[]) => ['solana-rewards', ...args],
    solanaRewardsTotal: (address: string) => ['solana-rewards-total', address],
    yieldOpportunities: (...args: unknown[]) => ['yield-opportunities', ...args],
    merkleRewards: (...args: unknown[]) => ['merkle-rewards', ...args],
    missingRateTickers: (...args: unknown[]) => ['missing-rate-tickers', ...args],
} as const satisfies Record<string, AllowedQueryKey>;

export const desktopQueryKeys = {
    defaultUrls: (symbol: string) => ['default-urls', symbol],
    proxyImage: (src?: string) => ['proxy-image', src],
    inactiveTokens: (symbol: string, accountKey?: string) =>
        accountKey ? ['inactive-tokens', symbol, accountKey] : ['inactive-tokens', symbol],
} as const satisfies Record<string, AllowedQueryKey>;

export const mobileQueryKeys = {} as const satisfies Record<string, AllowedQueryKey>;

export const tradingQueryKeys = {
    otcData: () => ['trading', 'otc-data'],
} as const satisfies Record<string, AllowedQueryKey>;
