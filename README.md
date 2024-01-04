<div align="center">

# sol_build

[![][code-quality-img]][code-quality] [![][docs-badge]][docs]

</div>

Compile Solidity smart contracts with Deno.

## Getting Started

Deno >=v1.25 is required.

To install `sol_build` globally run:

```sh
deno install --allow-read --allow-write --allow-net -f https://deno.land/x/sol_build/cli.ts
```

Initialize a new project with a sample `hello.sol` contract:

```sh
sol_build init helloworld
# Initializing a new project
# Fetching releases...
# Downloading soljson from https://solc-bin.ethereum.org/bin/soljson-v0.8.19+commit.7dd6d404.js...
cd helloworld
```

Compile all Solidity files and produce [Hardhat](https://github.com/NomicFoundation/hardhat)-compatible artifacts with ABIs, EVM bytecode and more:

```sh
sol_build compile
```

If you only need ABIs, pass the `--abi` option.
To run optimizations, pass the `--optimizer <number of runs>` flag. 

## Configuration

You can pass a custom config as a file with `sol_build -c sol.config.ts` if you need more flexible settings:

```ts
import type { Config } from 'https://deno.land/x/sol_build/config.ts'

export const config = {
  abi: true, // only produce ABIs
  // all solidity settings go here
}
```

CLI arguments have a higher priority over config except for `outputSelection` setting.

## Programmatic use

`sol_build` exports functions for finding, linking and compiling Solidity files.

```ts
import { compileToFs } from 'https://deno.land/x/sol_build/mod.ts'
import { createRequire } from 'https://deno.land/std@0.177.0/node/module.ts'

const require = createRequire(import.meta.url)
const solc = solc = wrapper(require('./.solc.js'))

await compileToFs(solc, { optimizer: { enabled: true, runs: 200 }})
```


[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-web3/sol_build?style=for-the-badge&color=626890&
[code-quality]: https://www.codefactor.io/repository/github/deno-web3/sol_build
[docs-badge]: https://img.shields.io/github/v/release/deno-web3/sol_build?label=Docs&logo=deno&style=for-the-badge&color=626890
[docs]: https://doc.deno.land/https/deno.land/x/sol_build/mod.ts
