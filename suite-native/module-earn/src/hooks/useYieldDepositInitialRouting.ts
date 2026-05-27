import { useCallback, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    initYieldAllowanceThunk,
    selectStablecoinYieldSession,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { getYieldDepositInitialRoute } from '../yieldDepositRoutingUtils';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldConsents>;

type UseYieldDepositInitialRoutingParams = {
    resolvedFlowData: ResolvedYieldFlowData;
    routeParams: YieldFlowParams;
};

export const useYieldDepositInitialRouting = ({
    resolvedFlowData,
    routeParams,
}: UseYieldDepositInitialRoutingParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const store = useStore<StablecoinYieldRootState>();
    const [isInitializingAllowance, setIsInitializingAllowance] = useState(false);

    const handleConfirmConsent = useCallback(async () => {
        if (resolvedFlowData.resolutionStatus !== 'resolved' || isInitializingAllowance) {
            return;
        }

        const sessionParams = {
            flowType: 'deposit' as const,
            flowKey: resolvedFlowData.flowKey,
        };
        const existingSession = selectStablecoinYieldSessionByFlowKey(
            store.getState(),
            sessionParams.flowType,
            sessionParams.flowKey,
        );
        const pendingTransaction = existingSession?.action.pendingTransaction ?? null;

        setIsInitializingAllowance(true);

        try {
            if (!pendingTransaction) {
                dispatch(stablecoinYieldActions.resetSession(sessionParams));

                await dispatch(
                    initYieldAllowanceThunk({
                        ...sessionParams,
                        flowData: resolvedFlowData.flowData,
                        shouldSkipApprovalStep: true,
                    }),
                );
            }

            if (!navigation.isFocused()) {
                return;
            }

            const session = selectStablecoinYieldSession(
                store.getState(),
                sessionParams.flowType,
                sessionParams.flowKey,
            );
            const nextRoute = getYieldDepositInitialRoute({
                allowanceAmount: session.approval.allowanceAmount,
                allowanceStatus: session.approval.allowanceStatus,
                pendingTransaction: session.action.pendingTransaction,
            });

            navigation.navigate(nextRoute, routeParams);
        } finally {
            setIsInitializingAllowance(false);
        }
    }, [dispatch, isInitializingAllowance, navigation, resolvedFlowData, routeParams, store]);

    return {
        handleConfirmConsent,
        isInitializingAllowance,
    };
};
