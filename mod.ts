import {
  CompilationError,
  download,
  ensureDir,
  Input,
  InputSettings,
  Output,
  walk,
  Wrapper,
} from './deps.ts'

export class BuildError extends Error implements CompilationError {
  formattedMessage: string
  component: string
  errorCode: string
  severity: 'error' | 'warning'
  sourceLocation: { end: number; file: string; start: number }
  type: string
  constructor(err: CompilationError) {
    super(err.message)
    this.name = 'CompilationError'
    this.message = err.message
    this.formattedMessage = err.formattedMessage
    this.component = err.component
    this.errorCode = err.errorCode
    this.severity = err.severity
    this.sourceLocation = err.sourceLocation
    this.type = err.type
  }
}

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

export const initProject = async (name: string, version: string) => {
  await Deno.mkdir(name)
  Deno.chdir(name)
  await Deno.mkdir('contracts')
  await download('.solc.js', version)
  try {
    const gitignore = await Deno.readTextFile('.gitignore')
    if (!gitignore.includes('.solc.js')) {
      await Deno.writeTextFile('.gitignore', '.solc.js\n', { append: true })
    }
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      await Deno.writeTextFile('.gitignore', '.solc.js')
    } else throw e
  }
  await Deno.writeTextFile('contracts/hello.sol', HelloWorld)
}

export const compile = async (
  solc: Wrapper,
  sources: Record<string, { content: string }>,
  settings: InputSettings,
): Promise<Output> => {
  const result = JSON.parse(
    solc.compile(
      JSON.stringify({
        sources,
        language: 'Solidity',
        settings: {
          ...settings,
          outputSelection: {
            '*': {
              '*': ['evm.bytecode', 'evm.deployedBytecode', 'abi'],
            },
          },
        },
      } as Input),
      { import: findImports },
    ),
  )
  return result
}

export const compileToFs = async (
  solc: Wrapper,
  settings: InputSettings,
) => {
  const files: Record<string, { content: string }> = {}

  for await (const entry of walk('.')) {
    if (entry.isFile && entry.name.endsWith('.sol')) {
      files[entry.path] = { content: await Deno.readTextFile(entry.path) }
    }
  }

  const result = await compile(solc, files, settings)

  if (result.errors) {
    throw new BuildError(result.errors[0])
  }

  const compiled = Object.entries(result.contracts).map(([sourceName, c]) => {
    return {
      sourceName,
      contracts: Object.entries(c).map(([contractName, contract]) => {
        return ({
          contractName,
          sourceName,
          bytecode: `0x${contract.evm.bytecode.object}`,
          abi: contract.abi,
          linkReferences: contract.evm.bytecode.linkReferences,
          deployedLinkReferences: contract.evm.deployedBytecode.linkReferences,
        })
      }),
    }
  })

  try {
    await Deno.remove('artifacts', { recursive: true })
  } catch {}
  await Deno.mkdir('artifacts')
  for (const { contracts, sourceName } of compiled) {
    await ensureDir(`artifacts/${sourceName}`)
    for (const contract of contracts) {
      await Deno.writeTextFile(
        `artifacts/${sourceName}/${contract.contractName}.json`,
        JSON.stringify(contract, null, 2),
      )
    }
  }

  return Object.keys(files).length
}
