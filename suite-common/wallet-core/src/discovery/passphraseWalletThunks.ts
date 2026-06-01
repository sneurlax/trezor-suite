import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type DiscoveryCallIds } from '@suite-common/wallet-types';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';
import { type PopupEventMessage, type UiEventMessage } from '@trezor/connect-common';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import { runDiscoveryThunk, startDiscoveryThunk } from './discoveryThunks';
import { defaultTrezorUIEventHandlerThunk } from '../uiEvent/defaultTrezorUIEventHandlerThunk';

const generateDiscoveryCallIds = (): DiscoveryCallIds => ({
    initialDeviceState: crypto.randomUUID(),
    emptyPassphraseCheck: crypto.randomUUID(),
    discoverAccounts: crypto.randomUUID(),
    confirmDeviceState: crypto.randomUUID(),
});

// Scoped variant of runDiscoveryThunk used by the passphrase modals (new-wallet
// "Next" click and retry paths). Mints a fresh callIds set, attaches a UI_EVENT
// listener that filters by membership in that set, and passes the same set down
// to runDiscoveryThunk so each Connect call is stamped with the matching slot.
// Forwards every event (except REQUEST_PASSPHRASE, which PassphraseModal owns)
// through the global default handler. Listener lifetime is exactly the
// runDiscoveryThunk runtime; no polling, no Map of in-flight promises, no
// abort signalling.
export const runPassphraseWalletAddingDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/runPassphraseWalletAddingDiscovery`,
    async ({ device }: { device: TrezorDevice }, { dispatch }) => {
        const callIds = generateDiscoveryCallIds();
        const scopedCallIdSet = new Set<string>(Object.values(callIds));
        const onUiEvent = (message: UiEventMessage | PopupEventMessage) => {
            const { event: _, ...action } = message;
            if (!('callId' in action) || !action.callId) return;
            if (!scopedCallIdSet.has(action.callId)) return;
            // PassphraseModal renders REQUEST_PASSPHRASE itself; routing it
            // through the global default handler would also open the global
            // passphrase modal and we'd end up with both stacked.
            if (action.type === UI_REQUEST.REQUEST_PASSPHRASE) return;
            dispatch(defaultTrezorUIEventHandlerThunk(action));
        };

        TrezorConnect.on(UI_EVENT, onUiEvent);
        try {
            await dispatch(runDiscoveryThunk({ device, callIds })).unwrap();
        } finally {
            TrezorConnect.off(UI_EVENT, onUiEvent);
        }
    },
);

// Sibling of startDiscoveryThunk for the "open an existing wallet" entry point.
// It mirrors startDiscoveryThunk exactly (device guard, in-progress guard, the
// startDiscovery state action) with one difference: for a hidden (passphrase)
// wallet it runs the *scoped* runPassphraseWalletAddingDiscoveryThunk instead of
// the plain runDiscoveryThunk. That keeps the passphrase UI_REQUEST callId-tagged
// so it stays owned by the scoped flow (and is swallowed by the global connect-init
// listener) instead of leaking into the global passphrase modal. A standard
// existing wallet has no passphrase, so it keeps the plain discovery.
export const startDiscoveryOfExistingPassphraseWalletThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/startDiscoveryOfExistingPassphraseWallet`,
    (
        {
            device,
            isAddingHiddenWallet,
            useScopedCallIds,
        }: {
            device: TrezorDevice | undefined;
            isAddingHiddenWallet?: boolean;
            useScopedCallIds?: boolean;
        },
        { dispatch, getState },
    ): void => {
        if (!device) {
            console.warn('startDiscoveryOfExistingPassphraseWalletThunk: no device found');

            return;
        }

        const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (isDiscoveryInProgress(currentDiscovery)) {
            console.warn(
                'startDiscoveryOfExistingPassphraseWalletThunk: discovery already in progress, cancelling start call',
            );

            return;
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                isAddingHiddenWallet,
                isAddingExistingWallet: true,
                useScopedCallIds,
            }),
        );

        if (isAddingHiddenWallet) {
            dispatch(runPassphraseWalletAddingDiscoveryThunk({ device }));
        } else {
            dispatch(runDiscoveryThunk({ device }));
        }
    },
);

// Single entry point for the "add wallet" buttons. Keeps the routing in one place
// instead of branching in the component:
//   - hidden (passphrase) wallet: scoped flow, so the passphrase UI_REQUEST is
//     callId-tagged and owned by the scoped discovery (not the global modal).
//       - existing wallet -> runs the scoped discovery right away,
//       - new wallet -> startDiscovery only sets state; PassphraseModal runs the
//         scoped discovery after the user confirms best practices.
//   - standard wallet: the plain startDiscoveryThunk (no passphrase to scope).
// `useScopedCallIds` is meaningful only for the passphrase flow, so it's derived
// from `isAddingHiddenWallet` rather than passed in.
export const startAddWalletDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/startAddWalletDiscovery`,
    (
        {
            device,
            isAddingHiddenWallet,
            isAddingExistingWallet,
        }: {
            device: TrezorDevice | undefined;
            isAddingHiddenWallet?: boolean;
            isAddingExistingWallet?: boolean;
        },
        { dispatch },
    ): void => {
        if (isAddingHiddenWallet && isAddingExistingWallet) {
            dispatch(
                startDiscoveryOfExistingPassphraseWalletThunk({
                    device,
                    isAddingHiddenWallet,
                    useScopedCallIds: true,
                }),
            );

            return;
        }

        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet,
                isAddingExistingWallet,
                useScopedCallIds: isAddingHiddenWallet,
            }),
        );
    },
);
