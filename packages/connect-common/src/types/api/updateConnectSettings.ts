/**
 * Update Connect settings such as proxy and transports configuration.
 *
 * `enabledNetworks` (see `ConnectSettings.enabledNetworks`) is applied additively; the
 * current set is readable from `getSettings().enabledNetworks`.
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
