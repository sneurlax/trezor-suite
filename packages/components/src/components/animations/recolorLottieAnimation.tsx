import { hexToRgbaArray } from '@trezor/utils';

// @ts-expect-error
type JsonValue = string | number | boolean | null | Record<string, JsonValue> | JsonValue[];

type LottieAnimation = JsonValue;

const areColorsClose = (a: number[], b: number[], tolerance = 0.01) =>
    a.length === 4 && b.length === 4 && a.every((v, i) => Math.abs(v - b[i]) < tolerance);

export const recolorLottieAnimation = (
    data: LottieAnimation,
    replacements: { from: string; to: string }[] | null,
): LottieAnimation => {
    if (replacements === null || replacements.length === 0) {
        return data;
    }

    const colorPairs = replacements.map(({ from, to }) => ({
        from: hexToRgbaArray(from),
        to: hexToRgbaArray(to),
    }));

    const cloned = JSON.parse(JSON.stringify(data));

    const findReplacement = (color: number[]): number[] | null => {
        for (const { from, to } of colorPairs) {
            if (areColorsClose(color, from)) {
                return to;
            }
        }

        return null;
    };

    const isNumberQuartet = (segment: unknown[]): segment is number[] =>
        segment.length === 4 && segment.every(n => typeof n === 'number');

    const walk = (node: unknown) => {
        if (Array.isArray(node)) {
            const arr = node as unknown[];
            // Find RGBA quartets in row (e.g. in gradients)
            for (let i = 0; i <= arr.length - 4; i++) {
                const segment = arr.slice(i, i + 4);
                if (isNumberQuartet(segment)) {
                    const replacement = findReplacement(segment);
                    if (replacement) {
                        arr.splice(i, 4, ...replacement);
                        i += 3;
                    }
                }
            }

            arr.forEach(walk);
        } else if (typeof node === 'object' && node !== null) {
            const obj = node as Record<string, unknown>;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];

                    // Simple rgba color
                    if (Array.isArray(value) && isNumberQuartet(value)) {
                        const replacement = findReplacement(value);
                        if (replacement) {
                            obj[key] = replacement;
                            continue;
                        }
                    }

                    walk(value);
                }
            }
        }
    };

    walk(cloned);

    return cloned;
};
