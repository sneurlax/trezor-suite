// `WalletDescriptor` is the first testnet address (44'/1'/0'/0/0) segment of a device's
// static session id. It is defined and produced by `@trezor/device-utils` (the single
// source of truth for static session id parsing); re-exported here for back-compat with
// existing `@suite-common/wallet` import sites.
export { type WalletDescriptor, asWalletDescriptor } from '@trezor/device-utils';
