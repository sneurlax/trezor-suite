import { type ReactNode, useCallback } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { type DiscoveryRootState, selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import {
    selectHasPassphraseError,
    selectPassphraseDiscoveryCompleted,
} from '../passphraseSelectors';

export const PassphraseFlowFailedRedirect = ({ children }: { children?: ReactNode }) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useFocusEffect(
        useCallback(() => {
            // TODO is this duplication of discovery status switch/case in the stack navigator?
            // if (hasPassphraseError) {
            navigateToInitialScreen();
            // }
        }, [navigateToInitialScreen]),
    );

    return children ?? null;
};
export const PassphraseFlowDoneRedirect = ({ children }: { children?: ReactNode }) => {
    const passphraseDiscoveryCompleted = useSelector(selectPassphraseDiscoveryCompleted);
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    const store = useStore();
    const hasPassphraseError = useSelector(selectHasPassphraseError);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useFocusEffect(
        useCallback(() => {
            // If there is passphrase error, we don't want to go back, but handle errors through alerts within the flow
            if (passphraseDiscoveryCompleted && !hasPassphraseError) {
                navigateToInitialScreen();

                const discovery = selectDiscoveryByDevicePath(
                    store.getState() as DiscoveryRootState,
                    device?.path,
                );
                if (discovery) {
                    analytics.report({
                        type: events.passphraseFlowFinishedEvent.name,
                        payload: { isEmptyWallet: !discovery.hasLoadedAnyNonEmptyAccount },
                    });
                }
            }
        }, [
            passphraseDiscoveryCompleted,
            hasPassphraseError,
            navigateToInitialScreen,
            store,
            device?.path,
            analytics,
        ]),
    );

    return children ?? null;
};
