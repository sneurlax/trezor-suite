// Makes a deep copy of an object.
export const cloneObject = <T>(obj: T, seen = new WeakMap<object, unknown>()): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (seen.has(obj)) {
        return seen.get(obj) as T;
    }

    if (obj instanceof ArrayBuffer) {
        return obj.slice(0) as T;
    }

    if (ArrayBuffer.isView(obj)) {
        const TypedArrayConstructor = obj.constructor as new (source: typeof obj) => typeof obj;

        return new TypedArrayConstructor(obj) as T;
    }

    const clone: unknown[] | Record<string, unknown> = Array.isArray(obj) ? [] : {};
    seen.set(obj, clone);

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = (obj as Record<string, unknown>)[key];

            if (typeof value === 'function' || typeof value === 'symbol') {
                continue;
            }

            (clone as Record<string, unknown>)[key] = cloneObject(value, seen);
        }
    }

    return clone as T;
};
