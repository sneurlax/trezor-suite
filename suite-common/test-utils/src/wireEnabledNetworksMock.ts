/**
 * Mocks `TrezorConnect.updateConnectSettings` so that `changeCoinVisibility` — which awaits it
 * to declare the coin to Connect one-way — resolves without a real Connect call. The Redux
 * `changeNetworks` dispatch is performed by `changeCoinVisibility` itself (Suite is the source
 * of truth for its coin settings), so this mock only needs to be a no-op success.
 */
export const wireEnabledNetworksMock = () => {
    // Lazy-require — a top-level `import TrezorConnect from '@trezor/connect'` here would
    // pull the connect-common types (cardano → @trezor/protobuf → @bufbuild/protobuf)
    // into every consumer of `@suite-common/test-utils`, breaking tests in jsdom envs
    // that lack the TextEncoder polyfill the runtime protobuf decoder needs.

    const TrezorConnect = require('@trezor/connect').default;

    // Replace unconditionally — works whether the existing function is the real one or a jest.fn.
    TrezorConnect.updateConnectSettings = jest.fn(() =>
        Promise.resolve({ success: true, payload: { message: 'success' } }),
    );
};
