const name = 'solanaSignMessage';

// OCMS v0 envelope for "Hello, Trezor!" (restricted ASCII, 14 bytes)
// Layout: [0xff][solana offchain\x00](17) + version(1) + appDomain(32) + format(1) + lenLE(2) + msg
const message =
    'ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000000e0048656c6c6f2c205472657a6f7221';

export default [
    {
        name,
        submitButton: 'Sign message',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/501'/0'/0'`,
            },
            {
                name: 'message',
                type: 'input-long',
                value: message,
            },
        ],
    },
];
