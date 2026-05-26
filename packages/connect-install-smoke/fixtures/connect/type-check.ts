import TrezorConnect from '@trezor/connect';

// Exercise subpath-imported types from devDependencies inlined into d.ts.
// If any inline `import("@trezor/*/libESM/...")` target is not resolvable
// (e.g. due to a missing exports-map entry in the producer package),
// tsc --noEmit would fail here, signalling a regression that the runtime
// smoke tests below cannot detect.
type ChangeLanguageParams = Parameters<typeof TrezorConnect.changeLanguage>[0];
type FirmwareUpdateParams = Parameters<typeof TrezorConnect.firmwareUpdate>[0];
type EthereumSignTypedDataParams = Parameters<typeof TrezorConnect.ethereumSignTypedData>[0];
type CardanoSignTransactionParams = Parameters<typeof TrezorConnect.cardanoSignTransaction>[0];

const _connect: typeof TrezorConnect = TrezorConnect;

export type {
    CardanoSignTransactionParams,
    ChangeLanguageParams,
    EthereumSignTypedDataParams,
    FirmwareUpdateParams,
};
export { _connect };
