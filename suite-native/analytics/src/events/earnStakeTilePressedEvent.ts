import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const earnStakeTilePressedEvent: EventDef<{}, EventType.EarnStakeTilePressed> = {
    name: EventType.EarnStakeTilePressed,
    descriptionTrigger: 'User taps or clicks on the Earn Stake tile to access staking opportunities',
    changelog: [{ version: '26.1.2', notes: 'added' }],
    attributes: {},
};
