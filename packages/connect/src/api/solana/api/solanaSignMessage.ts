import { SolanaSignMessage as SolanaSignMessageSchema } from '@trezor/connect-common';
import type { MethodPermission } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';

type Params = {
    address_n: number[];
    message: string;
    chunkify?: boolean;
};

export default class SolanaSignMessage extends AbstractMethod<'solanaSignMessage', Params> {
    constructor(message: MethodMessage<'solanaSignMessage'>) {
        const { payload } = message;

        Assert(SolanaSignMessageSchema, payload);

        const path = validatePath(payload.path, 2);

        const params: Params = {
            address_n: path,
            message: payload.message,
            chunkify: payload.chunkify,
        };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('Solana')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    get info() {
        return 'Sign Solana message';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        const { message } = await cmd.typedCall('SolanaSignMessage', 'SolanaMessageSignature', {
            address_n: this.params.address_n,
            message: this.params.message,
            chunkify: this.params.chunkify,
        });

        return { signature: message.signature };
    }
}
