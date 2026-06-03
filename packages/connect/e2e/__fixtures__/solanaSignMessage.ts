// OCMS = Solana Off-Chain Message Signing v0 envelope format
// https://github.com/solana-labs/solana/blob/master/docs/src/proposals/off-chain-message-signing.md
//
// Envelope layout (passed as `message` to the firmware):
//   [0xff][solana offchain\x00] (17 bytes, signing domain)
//   [0x00]                      (1 byte,  header version = 0)
//   [32 zero bytes]             (32 bytes, application domain — all-zero = generic wallet)
//   [format]                    (1 byte,  0x00 = restricted ASCII, 0x01 = UTF-8, 0x02 = extended)
//   [len LE2]                   (2 bytes, message body length, little-endian u16)
//   [message body]              (variable)

const legacyResults = [
    {
        // solanaSignMessage not supported below this version
        rules: ['<2.12.3', '1'],
        success: false,
    },
];

export default {
    method: 'solanaSignMessage',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/501'/0'/0' sign 'Hello, Trezor!' (restricted ASCII)",
            params: {
                path: "m/44'/501'/0'/0'",
                // OCMS v0 envelope for "Hello, Trezor!" (14 bytes, restricted ASCII)
                message:
                    'ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000000e0048656c6c6f2c205472657a6f7221',
            },
            result: {
                signature:
                    'f030bd7a10f225c20f825157fb53095966d147f0849431ec581c423ba0b8262dd42c35523b9e1d9000f6a985298b6da5f97d76d6c2ea41fbb0452a281a451d09',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0' sign 'Test message' (restricted ASCII)",
            params: {
                path: "m/44'/501'/0'",
                // OCMS v0 envelope for "Test message" (12 bytes, restricted ASCII)
                message:
                    'ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000000c0054657374206d657373616765',
            },
            result: {
                signature:
                    '8e7c4fe953ff4428d9013470f5dc92d3a84e05e6260db84b28ecd11bbdb3af97992752d204bf4892f301c19184c96d07d9b16e48225d90c3b5ec42b3290e8600',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0'/0' sign long message with chunkify",
            params: {
                path: "m/44'/501'/0'/0'",
                // OCMS v0 envelope for 98-byte restricted ASCII message
                // "This is a longer test message that should be chunked across multiple display screens on the device"
                message:
                    'ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000006200546869732069732061206c6f6e6765722074657374206d65737361676520746861742073686f756c64206265206368756e6b6564206163726f7373206d756c7469706c6520646973706c61792073637265656e73206f6e2074686520646576696365',
                chunkify: true,
            },
            result: {
                signature:
                    '1db507a31f57fe6d16f230ac9e9f35cff56b70a1c91f4dda565e67fb8380a59e4b292d1700b26567900ce32a0fddd9247fb79b1e0f8c7b58c71a99418d6e1c01',
            },
            legacyResults,
        },
    ],
} satisfies TestCase;
