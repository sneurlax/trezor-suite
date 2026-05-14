# Install smoke tests

Per-fixture install-and-import smoke tests for the `@trezor/connect*` family.
Each fixture is a self-contained mini-consumer that gets installed into a
freshly-generated `package.json`, then exercised at runtime and (optionally)
at the type level.

The connect ecosystem is **ESM-only** since v10. All fixtures consume the
packages via `import`.

## Layout

```
install-smoke/
├── helpers.sh                # run_install_smoke() entry point
├── render-package-json.mjs   # builds package.json from a fixture manifest
├── fixtures/
│   ├── connect/
│   ├── connect-mobile/
│   ├── connect-web/
│   └── connect-webextension/
```

Each fixture directory contains:

| File            | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `manifest.json` | Root package, runtime entry, extra deps for runtime / type-check scenarios |
| `index.mjs`     | Runtime smoke: imports the package and asserts on its surface              |
| `tsconfig.json` | TS config for the type-check pass (optional)                               |
| `type-check.ts` | Exercises the published `.d.ts` surface (optional)                         |

## Scenarios

The three top-level entry scripts each cover one install path:

| Script                  | Scenario        | What it tests                                       |
| ----------------------- | --------------- | --------------------------------------------------- |
| `test-connect-local.sh` | `local`         | Locally packed tarballs (pre-publish gate in CI)    |
| `test-npm-install.sh`   | `registry-npm`  | Latest published `@trezor/connect@<version>` (npm)  |
| `test-yarn-install.sh`  | `registry-yarn` | Latest published `@trezor/connect@<version>` (yarn) |

## Adding a fixture

1. `mkdir fixtures/<name>` and drop in `manifest.json` + `index.mjs`. Add
   `tsconfig.json` + `type-check.ts` if you want a type-check pass.
2. Call `run_install_smoke <name> <scenario> [type-check] [runtime]` from
   the relevant top-level script(s).

The fixture directory is excluded from `@trezor/connect`'s `tsconfig` and
`eslint` so its consumer-shaped files don't leak into connect's own
type-check and lint passes.
