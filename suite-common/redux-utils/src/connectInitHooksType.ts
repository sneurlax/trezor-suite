import type { TrezorDevice } from '@suite-common/suite-types';
import type { DEVICE, Device, UI_REQUEST } from '@trezor/connect';
import type { POPUP } from '@trezor/connect-common';

type UiRequestType = (typeof UI_REQUEST)[keyof typeof UI_REQUEST];
type PopupEventType = (typeof POPUP)[keyof typeof POPUP];

// Hooks invoked from the connect device-event listener in `connectInitThunk`.
// Keyed by the device-event type; the hook receives the connect Device plus
// the list of devices that were already connected before this event fired.
export type ConnectInitDeviceEventHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
>;

// Hooks invoked from `defaultTrezorUIEventHandlerThunk` for every UI/POPUP
// event. Keyed by `action.type`; registering only the slots the platform
// cares about — unregistered events are no-ops.
export type ConnectInitUiEventHooks = Partial<Record<UiRequestType | PopupEventType, () => void>>;

// Combined hook surface the composition root provides. Split into two maps
// so each handler reaches only into the group it owns; nothing in here is
// load-bearing for connect-init, the bodies in @suite-common/wallet-core
// (`defaultTrezorUIEventHandlerThunk`) and the device-event listener in
// `connectInitThunk` look these up to invoke platform-specific side effects.
export type ConnectInitHooks = {
    deviceEvent: ConnectInitDeviceEventHooks;
    uiEvent: ConnectInitUiEventHooks;
};
