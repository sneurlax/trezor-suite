import type { Dispatch } from '@reduxjs/toolkit';

import { notificationsActions } from '@suite-common/toast-notifications';

import { selectTorBootstrap } from '../torSelectors';
import { type TorBootstrap, type TorRootState, torActions } from '../torSlice';

export const setTorBootstrapSlowThunk =
    (isSlow: boolean) => (dispatch: Dispatch, getState: () => TorRootState) => {
        const previousTorBootstrap = selectTorBootstrap(getState());

        if (!previousTorBootstrap) {
            // Does not make sense to set bootstrap to slow when there is no bootstrap happening.
            return;
        }

        if (isSlow && !previousTorBootstrap?.isSlow) {
            dispatch(
                notificationsActions.addToast({
                    type: 'tor-is-slow',
                    autoClose: false,
                }),
            );
        }

        const payload: TorBootstrap = {
            current: previousTorBootstrap.current,
            total: previousTorBootstrap.total,
            isSlow,
        };

        dispatch(torActions.setTorBootstrap(payload));
    };
