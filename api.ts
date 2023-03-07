import { download, Input, Output, Wrapper } from './deps.ts'

const HelloWorld = `// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

contract HelloWorld {
  string public greet = "Hello World!";
}`

function findImports(importPath: string) {
  try {
    return { contents: Deno.readTextFileSync(importPath) }
  } catch (e) {
    return { error: e.message }
  }
}

export const initProject = async (version: string) => {
  await download('.solc.js', version)
  const gitignore = await Deno.readTextFile('.gitignore')
  if (!gitignore.includes('.solc.js')) await Deno.writeTextFile('.gitignore', '.solc.js\n', { append: true })
  await Deno.writeTextFile('hello.sol', HelloWorld)
}

export const compile = async (solc: Wrapper, file: string, settings: Input['settings']): Promise<Output> => {
  const source = await Deno.readTextFile(file)

  const result = JSON.parse(
    solc.compile(
      JSON.stringify({
        sources: { [file]: { content: source } },
        language: 'Solidity',
        settings: {
          ...settings,
          outputSelection: {
            '*': {
              '*': ['*'],
            },
          },
        },
      } as Input),
      { import: findImports },
    ),
  )
  return result
}

export const getFileNames = (output: Output) => Object.keys(output.contracts)

export const extractAbis = (output: Output) => Object.values(output.contracts).map((o) => Object.values(o)[0].abi)

export const extractBins = (output: Output) =>
  Object.values(output.contracts).map((o) => Object.values(o)[0].evm.bytecode.object)
