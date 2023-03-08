<div align="center">

# sol_build

[![GitHub Workflow Status][gh-actions-img]][github-actions] [![Codecov][cov-badge-url]][cov-url] [![][code-quality-img]][code-quality]

</div>

Deno CLI and API to compile Solidity smart contracts.

## Install

### CLI

```sh
deno install --allow-read --allow-write --allow-net -f https://deno.land/x/sol_build/cli.ts
```

### API

```ts
import { compileToFs } from 'https://deno.land/x/sol_build/mod.ts'
import { createRequire } from 'https://deno.land/std@0.177.0/node/module.ts'

const require = createRequire(import.meta.url)
const solc = solc = wrapper(require('./.solc.js'))

await compileToFs(solc, { optimizer: { enabled: true, runs: 200 }})
```

## CLI Reference

### `init`

Initializes a basic project with a `Hello World` contract and a compiler binary.

### `compile`

Compile Solidity files in a current directory and save outputs to the `artifacts` folder.

[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-web3/sol_build?style=for-the-badge&color=626890&
[code-quality]: https://www.codefactor.io/repository/github/deno-web3/sol_build
[cov-badge-url]: https://img.shields.io/coveralls/github/deno-web3/sol_build?style=for-the-badge&color=626890&
[cov-url]: https://coveralls.io/github/deno-web3/sol_build
[github-actions]: https://github.com/tinyhttp/deno-web3/sol_build
[gh-actions-img]: https://img.shields.io/github/actions/workflow/status/deno-web3/sol_build/main.yml?branch=master&style=for-the-badge&color=626890&label=&logo=github