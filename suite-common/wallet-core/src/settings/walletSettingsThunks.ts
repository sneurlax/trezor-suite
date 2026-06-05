import { type Dispatch } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect, { PROTO } from '@trezor/connect';

import { setBitcoinAmountUnits } from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectBitcoinAmountUnit, selectEnabledNetworks } from './walletSettingsReducer';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccountsToBeForgotten } from '../selectors';

export const changeCoinVisibility = createThunk<
    void,
    {
        symbol: NetworkSymbol;
        shouldBeVisible: boolean;
    },
    void
>(
    WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
    async ({ symbol, shouldBeVisible }, { dispatch, getState }) => {
        let enabledNetworks = selectEnabledNetworks(getState());
        const isAlreadyHidden = enabledNetworks.find(enabledSymbol => enabledSymbol === symbol);
        if (!shouldBeVisible) {
            enabledNetworks = enabledNetworks.filter(enabledSymbol => enabledSymbol !== symbol);
        } else if (!isAlreadyHidden) {
            enabledNetworks = [...enabledNetworks, symbol];
        }
        // Connect is the runtime source of truth. The update triggers a canonical
        // 'enabled-networks-changed' event; the connect-init listener writes it back to
        // Redux. By the time await resolves, Redux is up-to-date (in-module IPC is sync).
        await TrezorConnect.updateConnectSettings({ enabledNetworks });

        const accountsToRemove = selectAccountsToBeForgotten(getState());
        if (accountsToRemove.length > 0) {
            dispatch(accountsActions.removeAccount(accountsToRemove));
        }

        // this seems to be only for analyticsMiddleware
        // TODO: why does it fire an action with the same type as the thunk??
        dispatch({
            type: WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
            payload: { symbol, shouldBeVisible },
        });
    },
);

/**
 * Additively widen Suite's enabled networks with a set declared by a 3rd-party caller
 * (connect popup / desktop / deeplink). The caller's `init({ enabledNetworks })` extends the
 * host's set — it never removes what the user already enabled. No-op when nothing is new.
 */
export const addEnabledNetworks = createThunk<void, NetworkSymbol[], void>(
    '@common/wallet-settings/addEnabledNetworks',
    async (networks, { getState }) => {
        const current = selectEnabledNetworks(getState());
        const union = [...new Set([...current, ...networks])];
        if (union.length === current.length) return;

        // Connect is the runtime source of truth; the update emits 'enabled-networks-changed'
        // which the connect-init listener mirrors back into Redux.
        await TrezorConnect.updateConnectSettings({ enabledNetworks: union });
    },
);

export const toggleBitcoinAmountUnits = () => (dispatch: Dispatch, getState: () => any) => {
    const currentUnits = selectBitcoinAmountUnit(getState());

    const nextUnits =
        currentUnits === PROTO.AmountUnit.BITCOIN
            ? PROTO.AmountUnit.SATOSHI
            : PROTO.AmountUnit.BITCOIN;

    dispatch(setBitcoinAmountUnits(nextUnits));
};
