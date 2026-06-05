import * as enabledNetworksStore from '../enabledNetworksStore';

describe('enabledNetworksStore', () => {
    // Reset the singleton between tests — `set([])` is the canonical reset path.
    afterEach(() => {
        enabledNetworksStore.set([]);
    });

    it('starts empty', () => {
        expect(enabledNetworksStore.get()).toEqual([]);
        expect(enabledNetworksStore.has('ada')).toBe(false);
    });

    it('set populates the store and reports changed=true', () => {
        const result = enabledNetworksStore.set(['btc', 'ada']);

        expect(result.changed).toBe(true);
        expect(result.canonical).toEqual(expect.arrayContaining(['btc', 'ada']));
        expect(result.canonical).toHaveLength(2);
        expect(enabledNetworksStore.get()).toEqual(expect.arrayContaining(['btc', 'ada']));
        expect(enabledNetworksStore.has('ada')).toBe(true);
        expect(enabledNetworksStore.has('btc')).toBe(true);
        expect(enabledNetworksStore.has('eth')).toBe(false);
    });

    it('set replaces the previous value (no merge)', () => {
        enabledNetworksStore.set(['btc']);
        enabledNetworksStore.set(['eth']);

        expect(enabledNetworksStore.get()).toEqual(['eth']);
        expect(enabledNetworksStore.has('btc')).toBe(false);
        expect(enabledNetworksStore.has('eth')).toBe(true);
    });

    it('set deduplicates the incoming array', () => {
        const result = enabledNetworksStore.set(['ada', 'ada', 'btc', 'ada']);

        expect(result.canonical).toHaveLength(2);
        expect(result.canonical).toEqual(expect.arrayContaining(['ada', 'btc']));
    });

    it('set reports changed=false when the set is identical (any order)', () => {
        enabledNetworksStore.set(['btc', 'ada']);

        const result = enabledNetworksStore.set(['ada', 'btc']);

        expect(result.changed).toBe(false);
        expect(result.canonical).toEqual(expect.arrayContaining(['btc', 'ada']));
    });

    it('set reports changed=true when adding a symbol', () => {
        enabledNetworksStore.set(['btc']);

        const result = enabledNetworksStore.set(['btc', 'ada']);

        expect(result.changed).toBe(true);
    });

    it('set reports changed=true when removing a symbol', () => {
        enabledNetworksStore.set(['btc', 'ada']);

        const result = enabledNetworksStore.set(['btc']);

        expect(result.changed).toBe(true);
    });

    it('set([]) on a non-empty store reports changed=true and clears', () => {
        enabledNetworksStore.set(['ada']);

        const result = enabledNetworksStore.set([]);

        expect(result.changed).toBe(true);
        expect(enabledNetworksStore.get()).toEqual([]);
        expect(enabledNetworksStore.has('ada')).toBe(false);
    });

    it('get returns a fresh array each call (callers cannot mutate internal state)', () => {
        enabledNetworksStore.set(['btc']);
        const snapshot = enabledNetworksStore.get();
        snapshot.push('hack');

        expect(enabledNetworksStore.get()).toEqual(['btc']);
    });

    describe('add (additive union)', () => {
        it('widens the set without removing existing symbols', () => {
            enabledNetworksStore.set(['btc', 'eth']);

            const result = enabledNetworksStore.add(['ada']);

            expect(result.changed).toBe(true);
            expect(result.canonical).toEqual(expect.arrayContaining(['btc', 'eth', 'ada']));
            expect(result.canonical).toHaveLength(3);
        });

        it('reports changed=false when all symbols are already present', () => {
            enabledNetworksStore.set(['btc', 'ada']);

            const result = enabledNetworksStore.add(['ada']);

            expect(result.changed).toBe(false);
            expect(result.canonical).toHaveLength(2);
        });

        it('add([]) is a no-op', () => {
            enabledNetworksStore.set(['btc']);

            const result = enabledNetworksStore.add([]);

            expect(result.changed).toBe(false);
            expect(result.canonical).toEqual(['btc']);
        });

        it('add on an empty store behaves like set', () => {
            const result = enabledNetworksStore.add(['ada']);

            expect(result.changed).toBe(true);
            expect(enabledNetworksStore.has('ada')).toBe(true);
        });
    });

    describe('sanitizes untrusted input (3rd-party shape validation)', () => {
        it('set drops non-string and empty entries', () => {
            // emulate untrusted input that lies about its type
            const result = enabledNetworksStore.set([
                'btc',
                '',
                42,
                null,
                undefined,
                { coin: 'eth' },
                ['ada'],
                'ada',
            ] as any);

            expect(result.canonical).toEqual(expect.arrayContaining(['btc', 'ada']));
            expect(result.canonical).toHaveLength(2);
        });

        it('add drops non-string and empty entries', () => {
            enabledNetworksStore.set(['btc']);

            const result = enabledNetworksStore.add([null, 'ada', '', 7] as any);

            expect(result.canonical).toEqual(expect.arrayContaining(['btc', 'ada']));
            expect(result.canonical).toHaveLength(2);
        });

        it('coerces a non-array input to an empty set', () => {
            const result = enabledNetworksStore.set('ada' as any);

            expect(result.canonical).toEqual([]);
            expect(enabledNetworksStore.has('ada')).toBe(false);
        });

        it('add ignores a non-array input (no-op)', () => {
            enabledNetworksStore.set(['btc']);

            const result = enabledNetworksStore.add({ ada: true } as any);

            expect(result.changed).toBe(false);
            expect(result.canonical).toEqual(['btc']);
        });
    });
});
