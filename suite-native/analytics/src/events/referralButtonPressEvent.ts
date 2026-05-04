import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const referralButtonPressEvent: EventDef<Attributes, EventType.ReferralButtonPress> = {
    name: EventType.ReferralButtonPress,
    descriptionTrigger: 'User presses the referral button from the home screen',
    changelog: [{ version: '25.11.1', notes: 'added' }],
    attributes: {},
};
