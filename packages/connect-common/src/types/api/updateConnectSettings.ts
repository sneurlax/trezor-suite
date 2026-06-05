/**
 * Update Connect settings such as proxy and transports configuration.
 *
 * `enabledNetworks` declares which networks the application has enabled (drives
 * session-level derivation flags; today `'ada'` triggers a Cardano-aware session).
 * It is applied additively and only on in-process Core hosts — on the thin-client
 * transports (popup / desktop / webextension / deeplink) the Core lives in the host,
 * so declare networks via `init({ enabledNetworks })` there instead. Input is
 * sanitized: non-string and unknown coin symbols are dropped. The canonical
 * post-validation set is delivered back via the `'enabled-networks-changed'` event;
 * `getSettings().enabledNetworks` returns the current set.
 */

import type { Response } from '../params';
import type { ConnectSettingsTransport, Proxy } from '../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
    enabledNetworks?: string[];
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
