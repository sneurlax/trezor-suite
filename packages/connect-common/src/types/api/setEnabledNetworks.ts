/**
 * Declare which networks the application has enabled. Connect uses this set
 * when creating/validating device sessions (currently only `'ada'` triggers
 * a Cardano-aware THP session). The canonical post-validation set is delivered
 * back via the `'enabled-networks-changed'` event.
 *
 * Input is sanitized: non-string entries and unknown coin symbols are dropped,
 * so the canonical set may be smaller than what was passed in.
 */

import type { Response } from '../params';

export type SetEnabledNetworks = string[];

export declare function setEnabledNetworks(
    networks: SetEnabledNetworks,
): Response<{ message: 'success' }>;
