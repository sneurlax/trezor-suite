import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { UI_REQUEST } from '@trezor/connect';
import type { PopupEventMessage, UiEventMessage } from '@trezor/connect-common';
import { type Without } from '@trezor/type-utils';

const MODULE = '@common/wallet-core/uiEvent';

// `Without` distributes over the union so the discriminant on `type` survives
// after stripping `event`.
type UiEventAction = Without<UiEventMessage | PopupEventMessage, 'event'>;

// Default handler body for connect UI_EVENT messages, dispatched once by the
// global connectInitThunk listener for every event. Responsibilities:
//   - drop FIRMWARE_DOWNLOADED (web ignores it),
//   - dispatch the action so reducers/middlewares see it,
//   - addButtonRequest for REQUEST_PIN / INVALID_PIN / REQUEST_BUTTON,
//   - call the platform UI hook keyed by action.type (sourced from
//     extra.services.connectInitHooks so the body stays self-contained).
// Lives in wallet-core (not connect-init) so other consumers can import it
// without crossing the connect-init -> wallet-core dependency edge;
// connect-init re-exports it for back-compat.
export const defaultTrezorUIEventHandlerThunk = createThunk<void, UiEventAction, void>(
    `${MODULE}/defaultTrezorUIEventHandler`,
    (action, { dispatch, getState, extra }) => {
        const { connectInitHooks } = extra.services;

        if (action.type === UI_REQUEST.FIRMWARE_DOWNLOADED) {
            // We are in web therefore we ignore `FIRMWARE_DOWNLOADED` action.
            return;
        }

        dispatch(action);

        switch (action.type) {
            case UI_REQUEST.REQUEST_PIN:
            case UI_REQUEST.INVALID_PIN:
                dispatch(
                    deviceActions.addButtonRequest({
                        // todo: note that this is not 'threadsafe', currently selected device is not necessarily the device
                        // connect call was made for
                        device: selectSelectedDevice(getState()),
                        buttonRequest: {
                            code: action.payload.type ? action.payload.type : action.type,
                        },
                    }),
                );
                break;
            case UI_REQUEST.REQUEST_BUTTON: {
                const { device: _, ...request } = action.payload;
                dispatch(
                    deviceActions.addButtonRequest({
                        device: selectSelectedDevice(getState()),
                        buttonRequest: request,
                    }),
                );
                break;
            }
        }

        // Forward every UI/POPUP event to the platform UI hook keyed by action.type.
        // The composition root registers only the slots it cares about;
        // unregistered events are runtime no-ops via `?.`.
        connectInitHooks.uiEvent[action.type]?.();
    },
);
