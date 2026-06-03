import * as enabledNetworksStore from '../../data/enabledNetworksStore';
import { AbstractMethod, type MethodContext, type MethodReturnType } from '../AbstractMethod';

// Minimal concrete subclass — the Cardano enablement guard runs in the constructor, so we
// never reach `run`/`requiredPermissions`; they only satisfy the abstract contract.
class TestMethod extends AbstractMethod<any> {
    get requiredPermissions() {
        return [];
    }

    run(_context: MethodContext): Promise<MethodReturnType<any>> {
        return Promise.resolve(undefined as any);
    }
}

const make = (method: string, params: Record<string, unknown> = {}) =>
    new TestMethod({ payload: { method, ...params } } as any, undefined);

describe('AbstractMethod Cardano enablement guard', () => {
    // Reset the singleton between tests.
    afterEach(() => {
        enabledNetworksStore.set([]);
    });

    describe("rejects Cardano-bound calls while 'ada' is not enabled", () => {
        it('cardano* method name', () => {
            expect(() => make('cardanoGetAddress')).toThrow("requires 'ada' in enabled networks");
        });

        it('payload coin references ada', () => {
            expect(() => make('getAccountInfo', { coin: 'ada' })).toThrow(
                "requires 'ada' in enabled networks",
            );
        });

        it('payload coin references ada case-insensitively', () => {
            expect(() => make('getAccountInfo', { coin: 'ADA' })).toThrow();
        });

        it('a bundle coins entry references a Cardano symbol', () => {
            expect(() =>
                make('discoverAccounts', { coins: [{ symbol: 'btc' }, { symbol: 'tada' }] }),
            ).toThrow();
        });

        it('the thrown error carries the Method_NetworkNotEnabled code', () => {
            try {
                make('cardanoSignTransaction');
                throw new Error('expected guard to throw');
            } catch (error: any) {
                expect(error.code).toBe('Method_NetworkNotEnabled');
            }
        });
    });

    describe("allows calls once 'ada' is enabled", () => {
        beforeEach(() => {
            enabledNetworksStore.set(['ada']);
        });

        it('cardano* method enables derivation', () => {
            const method = make('cardanoGetAddress');
            expect(method.useCardanoDerivation).toBe(true);
        });

        it('payload coin ada enables derivation', () => {
            const method = make('getAccountInfo', { coin: 'ada' });
            expect(method.useCardanoDerivation).toBe(true);
        });

        it('derivation is on for any method once ada is declared (driven by the store)', () => {
            const method = make('getPublicKey');
            expect(method.useCardanoDerivation).toBe(true);
        });
    });

    describe('leaves non-Cardano calls untouched', () => {
        it('does not throw and keeps derivation off when ada is not enabled', () => {
            const method = make('getAccountInfo', { coin: 'btc' });
            expect(method.useCardanoDerivation).toBe(false);
        });

        it('ignores non-Cardano coins in a bundle', () => {
            const method = make('discoverAccounts', {
                coins: [{ symbol: 'btc' }, { symbol: 'eth' }],
            });
            expect(method.useCardanoDerivation).toBe(false);
        });
    });
});
