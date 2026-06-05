import { type PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';

export type DiscreetModeState = {
    isActive: boolean;
};

const initialState: DiscreetModeState = {
    isActive: false,
};

const discreetModeSlice = createSliceWithExtraDeps({
    name: 'discreetMode',
    initialState,
    reducers: {
        setDiscreetMode: (state, { payload }: PayloadAction<boolean>) => {
            state.isActive = payload;
        },
    },
    extraReducers: (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadDiscreetMode);
    },
});

export type DiscreetModeRootState = {
    discreetMode: DiscreetModeState;
};

export const discreetModeActions = discreetModeSlice.actions;
export const prepareDiscreetModeReducer = discreetModeSlice.prepareReducer;
