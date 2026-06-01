import type { BundleProgress, DeviceUniquePath, StaticSessionId } from '@trezor/connect';

// Stable set of callIds minted once per scoped discovery run.
// runPassphraseWalletAddingDiscoveryThunk generates the set and passes it to
// runDiscoveryThunk, which stamps each Connect call with its named slot so the
// scoped UI-event listener can filter by membership. Lives outside redux state
// — owned by the scoped run's lifetime only.
export type DiscoveryCallIds = {
    initialDeviceState: string;
    emptyPassphraseCheck: string;
    discoverAccounts: string;
    confirmDeviceState: string;
};

type CommonDiscoveryStatus = {
    isAddingHiddenWallet?: boolean; // to control visibility of special loader
    isAddingExistingWallet?: boolean; // to control visibility of special loader
    hasLoadedAnyNonEmptyAccount?: boolean; // NOTE: used to indicate the the discovery started loading actual accounts
    passphraseOnDevice?: boolean;
    startTimestamp?: number;
    passphraseSubmitted?: boolean;
    useScopedCallIds?: boolean;
};

export type DiscoveryStatus = CommonDiscoveryStatus &
    (
        | {
              status: 'starting';
          }
        | {
              status: 'enter-passphrase';
          }
        | {
              status: 'passphrase-duplicate';
              duplicateDeviceStaticSessionId: StaticSessionId;
          }
        | {
              status: 'passphrase-mismatch';
          }
        | {
              status: 'cancelled';
          }
        | {
              status: 'progress';
              total: BundleProgress<any>['payload']['total'];
              progress: BundleProgress<any>['payload']['progress'];
          }
        | {
              status: 'confirm-empty-passphrase';
              accountFailed?: boolean;
          }
        | {
              status: 'complete';
          }
        | {
              status: 'failed';
              error?: string;
              errorCode?: 'Method_InvalidParameter' | (string & {});
          }
    );

export type Discovery = Record<DeviceUniquePath, DiscoveryStatus>;
