import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const promoDesktopEvent: EventDef<Attributes, EventType.PromoDesktop> = {
    name: EventType.PromoDesktop,
    descriptionTrigger: 'User clicks on the desktop application promotional banner',
    changelog: [{ version: '23.5.2', notes: 'added' }],

    attributes: {},
};
