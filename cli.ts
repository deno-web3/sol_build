import {
  colors,
  Command,
  createRequire,
  dirname,
  ensureDir,
  Wrapper,
  wrapper,
} from './deps.ts'
import * as api from './api.ts'
const require = createRequire(import.meta.url)

await new Command()
  .name('sol_build')
  .description('Deno CLI for compiling Solidity smart contracts.')
  .version('0.0.0')
  .command('init')
  .description(
    'Initializes a basic project with a sample contract and a compiler binary.',
  )
  .option('-v, --version <version:string>', 'Solidity compiler version')
  .action(async ({ version }) => {
    await api.initProject(version!)
  })
  .command('compile')
  .description('Compile Solidity file')
  .arguments('<file:string>')
  .option(
    '--optimizer [runs:number]',
    'Enable optimizer (optionally with custom number of runs)',
  )
  .action(async ({ optimizer }, file) => {
    let solc: Wrapper
    try {
      solc = wrapper(require('./.solc.js'))
    } catch {
      return console.error(
        colors.red(
          `Error: Solidity compiler is not installed, run sol_build init first.`,
        ),
      )
    }

    const result = await api.compile(solc, file, {
      optimizer: {
        enabled: !!optimizer,
        runs: typeof optimizer === 'number' ? optimizer : undefined,
      },
    })
    const filenames = api.getFileNames(result)

    const output = Object.values(result.contracts).map((c) => {
      const contract = Object.values(c)[0]
      return ({
        bytecode: contract.evm.bytecode.object,
        abi: contract.abi,
        linkReferences: contract.evm.bytecode.linkReferences,
        deployedLinkReferences: contract.evm.deployedBytecode.linkReferences
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
  })
  .parse(Deno.args)
