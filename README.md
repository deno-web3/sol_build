# sol_build

Deno CLI for compiling Solidity smart contracts.

## Install

```sh
deno install -Afq https://deno.land/x/sol_build/cli.ts
```

## CLI Reference

### `init`

Initializes a basic project with a `Hello World` contract and a compiler binary.

### `compile <file.sol>`

Compile a Solidity file entrypoint and generate ABIs, EVM bytecode and link references.
