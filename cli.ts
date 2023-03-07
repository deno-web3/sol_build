import { colors, Command, createRequire, Wrapper, wrapper } from './deps.ts'
import * as api from './api.ts'
import { exists } from './utils.ts'
const require = createRequire(import.meta.url)

await new Command()
  .name('sol_build')
  .description('Deno CLI for compiling Solidity smart contracts.')
  .version('0.0.0')
  .command('init')
  .description('Initializes a basic project with a sample contract and a compiler binary.')
  .option('-v, --version <version:string>', 'Solidity compiler version')
  .action(async ({ version }) => {
    await api.initProject(version!)
  })
  .command('compile')
  .description('Compile Solidity file')
  .arguments('<file:string>')
  .option('--optimizer [runs:number]', 'Enable optimizer (optionally with custom number of runs)')
  .option('--bin', 'Save contract EVM bytecode in .bin files')
  .action(async ({ optimizer, bin }, file) => {
    let solc: Wrapper
    try {
      solc = wrapper(require('./.solc.js'))
    } catch {
      return console.error(colors.red(`Error: Solidity compiler is not installed, run sol_build init first.`))
    }

    const result = await api.compile(solc, file, {
      optimizer: {
        enabled: !!optimizer,
        runs: typeof optimizer === 'number' ? optimizer : undefined,
      },
    })
    const filenames = api.getFileNames(result)
    const abis = api.extractAbis(result)
    if (await exists('artifacts')) await Deno.remove('artifacts', { recursive: true })
    await Deno.mkdir('artifacts')
    filenames.map(async (file, i) => await Deno.writeTextFile(`artifacts/${file.replace('.sol', '.json')}`, JSON.stringify(abis[i])))

    if (bin) {
      const binaries = api.extractBins(result)
      filenames.map(async (file, i) => await Deno.writeTextFile(`artifacts/${file.replace('.sol', '.bin')}`, binaries[i]))

    }
  })
  .parse(Deno.args)
