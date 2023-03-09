import { Config } from './config.ts'
import {
  colors,
  Command,
  createRequire,
  InputSettings,
  Wrapper,
  wrapper,
} from './deps.ts'
import * as api from './mod.ts'
const require = createRequire(import.meta.url)

const cwd = Deno.cwd()

await new Command()
  .name('sol_build')
  .description('Deno CLI for compiling Solidity smart contracts.')
  .version('0.0.0')
  .command('init')
  .description(
    'Initializes a basic project with a sample contract and a compiler binary.',
  )
  .arguments('<name:string>')
  .option('-v, --version <version:string>', 'Solidity compiler version')
  .action(async ({ version }, name) => {
    console.log(colors.cyan('Initializing a new project'))
    await api.initProject(name, version!)
  })
  .command('compile')
  .description('Compile Solidity file')
  .option(
    '--optimizer [runs:number]',
    'Enable optimizer (optionally with custom number of runs)',
  )
  .option('--config, -c <file:string>', 'Config file')
  .option('--abi', 'Generate only ABIs')
  .action(async ({ optimizer, abi, config }) => {
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
    let count = 0
    let configAbi: boolean | undefined = false
    let configModule: InputSettings = {}
    if (config) {
      const { abi, ...cfg }: Config = await import(
        `${cwd}/${config}`
      ).then((m) => m.config)
      configAbi = abi
      configModule = cfg
    }

    try {
      count = await api.compileToFs(solc, {
        ...configModule,
        optimizer: {
          enabled: typeof optimizer === 'undefined'
            ? configModule.optimizer?.enabled
            : !!optimizer,
          runs: typeof optimizer === 'undefined'
            ? configModule.optimizer?.runs
            : typeof optimizer === 'number'
            ? optimizer
            : 200,
        },
        outputSelection: {
          '*': {
            // @ts-ignore types bug
            '*': configAbi || abi
              ? ['abi']
              : ['evm.bytecode', 'evm.deployedBytecode', 'abi'],
          },
          ...configModule.outputSelection,
        },
      })
    } catch (e) {
      return console.error(
        colors.red(`Error: Failed to compile\n`),
        e as Error,
      )
    }
    console.log(
      colors.green(
        `Compiled ${count} Solidity file${count > 1 ? 's' : ''} successfully`,
      ),
    )
  })
  .parse(Deno.args)
