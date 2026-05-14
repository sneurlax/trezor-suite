import { type CryptoId } from 'invity-api';

import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import {
    deriveBitcoinSwapFromAddresses,
    getApprovalStatus,
    requiresTokenApproval,
    tokenSupportsIncreasingAllowance,
} from '../exchangeUtils';

jest.mock('@trezor/connect', () => ({
    composeTransaction: jest.fn(),
}));

describe('requiresTokenApproval', () => {
    it('should return false when no quote is provided', () => {
        const result = requiresTokenApproval(undefined);
        expect(result).toBe(false);
    });

    it('should return false for CEX quotes', () => {
        const quote = {
            orderId: 'test-order',
            isDex: false,
            send: 'ethereum' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when sending native EVM token (ETH)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'ethereum' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when send is not specified', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return true for DEX quotes with ERC-20 tokens', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });
});

describe('getApprovalStatus', () => {
    const dexTokenSend = 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId;

    it('should return null when no quote is provided', () => {
        const result = getApprovalStatus(undefined);
        expect(result).toBe(null);
    });

    it('should return "approved" when quote has preapprovedStringAmount and is not APPROVAL_REQ', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: dexTokenSend,
            status: 'CONFIRM' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "approved" when quote has preapprovedStringAmount !== "0" without status', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: dexTokenSend,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "needs_increase" when quote has preapprovedStringAmount !== "0" and status is APPROVAL_REQ', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: dexTokenSend,
            status: 'APPROVAL_REQ' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_increase');
    });

    it('should return "needs_revoke" when quote has preapprovedStringAmount !== "0" and status is APPROVAL_REQ and tokenSupportsIncreasingAllowance is false', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
            status: 'APPROVAL_REQ' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_revoke');
    });

    it('should return "needs_approval" when preapprovedStringAmount is "0" and isDex is true', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0',
            isDex: true,
            send: dexTokenSend,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "needs_approval" when quote is DEX', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: true,
            send: 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "not_needed" for regular quote', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: false,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('not_needed');
    });
});

describe('tokenSupportsIncreasingAllowance', () => {
    it('should return false for Ethereum USDT contract address (uppercase)', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        );
        expect(result).toBe(false);
    });

    it('should return false for Ethereum USDT contract address (lowercase)', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
        );
        expect(result).toBe(false);
    });

    it('should return true for other contract addresses', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0x1234567890123456789012345678901234567890',
        );
        expect(result).toBe(true);
    });

    it('should return false for undefined contract address', () => {
        const result = tokenSupportsIncreasingAllowance(undefined);
        expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
        const result = tokenSupportsIncreasingAllowance('');
        expect(result).toBe(false);
    });
});

describe('deriveBitcoinSwapFromAddresses', () => {
    const account = {
        networkType: 'bitcoin',
        addresses: {
            unused: [{ address: 'unused-address', path: "m/44'/0'/0'/0/0" }],
            used: [{ address: 'used-address', path: "m/44'/0'/0'/0/1" }],
            change: [{ address: 'change-address', path: "m/44'/0'/0'/1/0" }],
        },
        utxo: [{ address: 'used-address', path: "m/44'/0'/0'/0/1" }],
        availableBalance: '10000',
        path: "m/44'/0'/0'",
    } as unknown as Account;

    const network = {
        symbol: 'btc',
        decimals: 8,
    } as unknown as Network;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return undefined if btcSwapDummyData is not provided', async () => {
        const result = await deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: '0.0001',
            decimals: 8,
        });

        expect(result).toBeUndefined();
    });

    it('should calculate swap from address with default mock config', async () => {
        (TrezorConnect.composeTransaction as jest.Mock).mockResolvedValue({
            success: true,
            payload: [
                {
                    type: 'final',
                    inputs: [{ address_n: [2147483692, 2147483648, 2147483648, 0, 1] }],
                    outputs: [{ amount: '5000' }],
                },
            ],
        });

        const result = await deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: '0.0001',
            decimals: 8,
            btcSwapDummyData: {
                opreturn: {
                    dataHex:
                        '3078306632656166663639313734646264333963366533346661366465653966326266626566663363313139366462303666636238356339313364376531663466643d7c6c6966696351',
                },
                feePercentage: 2,
            },
        });

        expect(result).toEqual({
            addresses: ['used-address'],
            amount: '5000',
        });
        expect(TrezorConnect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                outputs: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'opreturn',
                        dataHex:
                            '3078306632656166663639313734646264333963366533346661366465653966326266626566663363313139366462303666636238356339313364376531663466643d7c6c6966696351',
                    }),
                    expect.objectContaining({
                        type: 'payment',
                        amount: '200', // 10000 satoshis (0.0001 BTC) * 2% fee = 200
                        address: 'unused-address',
                    }),
                ]),
            }),
        );
    });

    it('should calculate swap from address with custom btcSwapDummyData config', async () => {
        (TrezorConnect.composeTransaction as jest.Mock).mockResolvedValue({
            success: true,
            payload: [
                {
                    type: 'final',
                    inputs: [{ address_n: [2147483692, 2147483648, 2147483648, 0, 1] }],
                    outputs: [{ amount: '4000' }],
                },
            ],
        });

        const result = await deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: '0.0001',
            decimals: 8,
            btcSwapDummyData: {
                opreturn: {
                    dataHex: 'custom_opreturn',
                },
                feePercentage: 5,
            },
        });

        expect(result).toEqual({
            addresses: ['used-address'],
            amount: '4000',
        });
        expect(TrezorConnect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                outputs: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'opreturn',
                        dataHex: 'custom_opreturn',
                    }),
                    expect.objectContaining({
                        type: 'payment',
                        amount: '500', // 10000 satoshis (0.0001 BTC) * 5% fee = 500
                        address: 'unused-address',
                    }),
                ]),
            }),
        );
    });
});
