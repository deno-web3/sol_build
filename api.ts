import {
  CompilationError,
  dirname,
  download,
  ensureDir,
  Input,
  Output,
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

export const initProject = async (version: string) => {
  await download('.solc.js', version)
  const gitignore = await Deno.readTextFile('.gitignore')
  if (!gitignore.includes('.solc.js')) {
    await Deno.writeTextFile('.gitignore', '.solc.js\n', { append: true })
  }
  await Deno.writeTextFile('hello.sol', HelloWorld)
}

export const compile = async (
  solc: Wrapper,
  file: string,
  settings: Input['settings'],
): Promise<Output> => {
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

export const getFileNames = (output: Output) => Object.keys(output.contracts)

export const saveResult = async (
  solc: Wrapper,
  file: string,
  optimizer?: number | true,
) => {
  const result = await compile(solc, file, {
    optimizer: {
      enabled: !!optimizer,
      runs: typeof optimizer === 'number' ? optimizer : undefined,
    },
  })

  if (result.errors) {
    throw new BuildError(result.errors[0])
  }
  const filenames = getFileNames(result)

  const output = Object.values(result.contracts).map((c) => {
    const contract = Object.values(c)[0]
    return ({
      bytecode: `0x${contract.evm.bytecode.object}`,
      abi: contract.abi,
      linkReferences: contract.evm.bytecode.linkReferences,
      deployedLinkReferences: contract.evm.deployedBytecode.linkReferences,
    })
  })

  try {
    await Deno.remove('artifacts', { recursive: true })
  } catch {}
  await Deno.mkdir('artifacts')

  filenames.map(async (file, i) => {
    const filename = file.replace('.sol', '.json')
    await ensureDir(`artifacts/${dirname(filename)}`)
    await Deno.writeTextFile(
      `artifacts/${filename}`,
      JSON.stringify(
        output[i],
        null,
        2,
      ),
    )
  })
  return filenames.length
}
