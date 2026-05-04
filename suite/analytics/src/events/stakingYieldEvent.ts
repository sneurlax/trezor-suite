import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<
        Extract<
            EarnAnalyticsStep,
            | 'earn-dashboard'
            | 'yield-supply'
            | 'yield-withdraw'
            | 'stake-in-a-nutshell-modal'
            | 'funds-maintained-modal'
        >
    >;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingYieldEvent: EventDef<Attributes, EventType.StakingYield> = {
    name: EventType.StakingYield,
    descriptionTrigger: 'User navigates through the yield/staking supply/withdraw flow, with tracking at each step of the process',
    changelog: [{ version: '26.2.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '26.2.0', notes: 'added' },
                {
                    version: '26.3.0',
                    notes: 'action values changed to `continue` | `cancel` | `close`',
                },
            ],
            description: 'User action: "continue" to proceed, "cancel" to abort, "close" to exit the dialog',
        },
        step: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Current step in the yield flow: "earn-dashboard", "yield-supply", "yield-withdraw", "stake-in-a-nutshell-modal", or "funds-maintained-modal"',
        },
        networkSymbol: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'The blockchain network symbol for yield/staking (e.g., "eth", "sol", "ada")',
        },
        currency: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Currency type: "crypto" for cryptocurrency amount, "fiat" for fiat currency conversion',
        },
    },
};
