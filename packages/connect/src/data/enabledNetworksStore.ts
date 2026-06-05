/**
 * Runtime store for the application-declared set of enabled networks.
 *
 * Populated additively via `Core.handleMessage(SET_ENABLED_NETWORKS)` (from
 * `updateConnectSettings` / `init`); reads are synchronous from anywhere in the connect
 * package (see AbstractMethod's resolution of `useCardanoDerivation`, and GetSettings).
 *
 * Keyed by coin symbol. Only `coin` is consumed today; the full `EnabledNetwork` object
 * (with future `permissions` / `backends`) is retained so it's available once those land.
 */

import type { EnabledNetwork } from '@trezor/connect-common';

import { getCoinInfo } from './coinInfo';

let networks: ReadonlyMap<string, EnabledNetwork> = new Map();

// The input originates from untrusted 3rd-party callers (init settings, `updateConnectSettings`,
// the popup/desktop handshake, the mobile deeplink JSON). TS types are not a runtime
// guarantee, so coerce defensively: accept only an array, and keep only entries that are
// objects with a non-empty string `coin` resolving to a known coin (`getCoinInfo`). Unknown
// coins (e.g. 'meow') and malformed entries are dropped rather than thrown — a single bad
// entry must not reject the whole call.
const sanitize = (input: unknown): EnabledNetwork[] =>
    Array.isArray(input)
        ? input.filter(
              (n): n is EnabledNetwork =>
                  !!n &&
                  typeof n === 'object' &&
                  typeof (n as EnabledNetwork).coin === 'string' &&
                  (n as EnabledNetwork).coin !== '' &&
                  getCoinInfo((n as EnabledNetwork).coin) !== undefined,
          )
        : [];

export const get = (): EnabledNetwork[] => [...networks.values()];

export const has = (coin: string): boolean => networks.has(coin);

export const set = (next: unknown): void => {
    networks = new Map(sanitize(next).map(network => [network.coin, network]));
};

// Additive union — entries are added, never removed. Suite coin-enable, 3rd-party
// `init({ enabledNetworks })`, handshake and deeplink all widen the set; disabling a coin is
// intentionally not propagated (Connect keeps deriving, which is harmless and resets on init).
export const add = (extra: unknown): void => {
    const next = new Map(networks);
    sanitize(extra).forEach(network => next.set(network.coin, network));
    networks = next;
};
