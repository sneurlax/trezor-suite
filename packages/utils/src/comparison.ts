export const deepEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return false;
    if (typeof a !== 'object') return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
        const arrB = b as unknown[];
        if (a.length !== arrB.length) return false;

        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], arrB[i])) return false;
        }

        return true;
    }

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
        if (!deepEqual(objA[key], objB[key])) return false;
    }

    return true;
};

export const isChanged = (
    prev?: unknown,
    current?: unknown,
    filter?: { [k: string]: string[] },
): boolean => {
    // 1. both objects are the same (solves simple types like string, boolean and number)
    if (prev === current) return false;
    // 2. one of the objects is null/undefined
    if (!prev || !current) return true;

    const prevType = Object.prototype.toString.call(prev);
    const currentType = Object.prototype.toString.call(current);
    // 3. one of the objects has different type then other
    if (prevType !== currentType) return true;

    if (currentType === '[object Array]') {
        const arrPrev = prev as unknown[];
        const arrCurrent = current as unknown[];
        // 4. Array length is different
        if (arrPrev.length !== arrCurrent.length) return true;
        // observe array recursive
        for (let i = 0; i < arrCurrent.length; i++) {
            if (isChanged(arrPrev[i], arrCurrent[i], filter)) return true;
        }
    } else if (currentType === '[object Object]') {
        const objPrev = prev as Record<string, unknown>;
        const objCurrent = current as Record<string, unknown>;
        const prevKeys = Object.keys(objPrev);
        const currentKeys = Object.keys(objCurrent);
        // 5. simple validation of keys length
        if (prevKeys.length !== currentKeys.length) return true;

        // 6. "prev" has keys which "current" doesn't have
        const prevDifference = prevKeys.find(k => !currentKeys.includes(k));
        if (prevDifference) return true;

        // 8. observe every key recursive
        for (let i = 0; i < currentKeys.length; i++) {
            const key = currentKeys[i];

            if (
                filter &&
                Object.prototype.hasOwnProperty.call(filter, key) &&
                objPrev[key] &&
                objCurrent[key]
            ) {
                const prevFiltered: Record<string, unknown> = {};
                const currentFiltered: Record<string, unknown> = {};
                const prevAtKey = objPrev[key] as Record<string, unknown>;
                const currentAtKey = objCurrent[key] as Record<string, unknown>;
                for (let i2 = 0; i2 < filter[key].length; i2++) {
                    const field = filter[key][i2];
                    prevFiltered[field] = prevAtKey[field];
                    currentFiltered[field] = currentAtKey[field];
                }
                if (isChanged(prevFiltered, currentFiltered)) return true;
            } else if (isChanged(objPrev[key], objCurrent[key])) {
                return true;
            }
        }
    } else if (prev !== current) {
        // solve simple types like string, boolean and number
        return true;
    }

    return false;
};
