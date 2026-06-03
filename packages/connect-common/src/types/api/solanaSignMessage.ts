import type { Params, Response } from '../params';
import type { SolanaSignMessage, SolanaSignedMessage } from './solana';

export declare function solanaSignMessage(
    params: Params<SolanaSignMessage>,
): Response<SolanaSignedMessage>;
