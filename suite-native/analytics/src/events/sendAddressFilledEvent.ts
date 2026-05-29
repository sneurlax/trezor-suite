import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type AddressFilledMethod = 'manual' | 'qr';

type Attributes = {
    method: AttributeDef<AddressFilledMethod>;
};

export const sendAddressFilledEvent: EventDef<Attributes, EventType.SendAddressFilled> = {
    name: EventType.SendAddressFilled,
    descriptionTrigger:
        'User fills the recipient address in the send form either by manual entry or by scanning a QR code',
    changelog: [{ version: '24.10.1', notes: 'added' }],
    attributes: {
        method: {
            description: 'How the address was provided: `manual` for keyboard entry, `qr` for QR code scan',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
    },
};
