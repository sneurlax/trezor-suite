import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import { type DiscoveryStatus } from '@suite-common/wallet-types';

import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { useSelector } from 'src/hooks/suite';

const HIDDEN_WALLET_TERMINAL_STATUSES: ReadonlySet<DiscoveryStatus['status']> = new Set([
    'cancelled',
    'failed',
    'complete',
]);

// Renderer for the add-passphrase-wallet flow. Decides, purely from discovery
// state, whether the PassphraseModal should be mounted. The discovery itself
// (state machine, UI_EVENT subscription, lifetime) is owned by
// runPassphraseWalletAddingDiscoveryThunk; this component is a pure projection
// of that state.
export const AddPassphraseWalletFlow = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state =>
        device?.path ? selectDiscoveryByDevicePath(state, device.path) : undefined,
    );

    // `isAddingHiddenWallet` is the flag startDiscoveryThunk sets when the user
    // initiated the "add hidden/passphrase wallet" flow (as opposed to a
    // regular standard-wallet discovery or an existing-wallet rescan). Together
    // with `useScopedCallIds`, it's how we recognise *this* discovery as the
    // one owned by the passphrase modal flow and not, say, a background standard
    // discovery whose modal we shouldn't be rendering.
    const isActive =
        !!device &&
        discovery?.useScopedCallIds === true &&
        discovery?.isAddingHiddenWallet === true &&
        !HIDDEN_WALLET_TERMINAL_STATUSES.has(discovery.status);

    if (!isActive || !device) return null;

    return <PassphraseModal device={device} />;
};
