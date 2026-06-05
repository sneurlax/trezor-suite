/**
 * Update Connect settings such as proxy and transports configuration.
 *
 * `enabledNetworks` declares which networks the application has enabled (drives
 * session-level derivation flags; today `coin: 'ada'` triggers a Cardano-aware session).
 * It is applied **additively** — entries are added to the set, removing a network is not
 * propagated. Input is sanitized: non-object entries and unknown coin symbols are dropped.
 * The current set is readable from `getSettings().enabledNetworks`.
 */

import type { Response } from '../params';
import type { ConnectSettingsTransport, EnabledNetwork, Proxy } from '../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
    enabledNetworks?: EnabledNetwork[];
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
