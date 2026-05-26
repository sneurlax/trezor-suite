import type { Dispatch } from '@reduxjs/toolkit';

import { selectTorBootstrap } from '../torSelectors';
import { type TorBootstrap, type TorRootState, torActions } from '../torSlice';

export const setTorBootstrapThunk =
    (torBootstrap: TorBootstrap) => (dispatch: Dispatch, getState: () => TorRootState) => {
        const previousTorBootstrap = selectTorBootstrap(getState());

        const payload: TorBootstrap = {
            current: torBootstrap.current,
            total: torBootstrap.total,
            isSlow: previousTorBootstrap ? previousTorBootstrap.isSlow : false,
        };

        dispatch(torActions.setTorBootstrap(payload));
    };
