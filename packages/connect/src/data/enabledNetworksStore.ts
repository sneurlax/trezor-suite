/**
 * Runtime store for the application-declared set of enabled networks.
 *
 * Mutations come in via `Core.handleMessage(SET_ENABLED_NETWORKS)`; reads are
 * synchronous from anywhere in the connect package (see AbstractMethod's
 * resolution of `useCardanoDerivation`). The IPC entry layer keeps its own
 * cache hydrated by the `'enabled-networks-changed'` event.
 */

let networks: ReadonlySet<string> = new Set();

export const get = (): string[] => [...networks];

export const has = (symbol: string): boolean => networks.has(symbol);

export const set = (next: string[]): { canonical: string[]; changed: boolean } => {
    const nextSet = new Set(next);
    const changed =
        nextSet.size !== networks.size || [...nextSet].some(symbol => !networks.has(symbol));
    networks = nextSet;

    return { canonical: [...nextSet], changed };
};

// Additive union. Third-party `init({ enabledNetworks })` (popup / desktop / webextension /
// deeplink hosts) widens the host's set rather than replacing it — a 3rd-party call on a new
// coin extends the enabled set, it never disables what the host already had. Only the host's
// own authoritative toggle (`set`, via SET_ENABLED_NETWORKS) may remove networks.
export const add = (extra: string[]): { canonical: string[]; changed: boolean } => {
    const nextSet = new Set(networks);
    extra.forEach(symbol => nextSet.add(symbol));
    const changed = nextSet.size !== networks.size;
    networks = nextSet;

    return { canonical: [...nextSet], changed };
};
