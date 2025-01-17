import yargs from 'yargs';
import cli from 'jest-cli';
import {buildArgv} from 'jest-cli/build/cli';
import jest from 'jest';
import path from 'path';
import {loadConfig} from '../../config';

import {info, debug, warn, error} from '../../logger';

export async function test(argv: yargs.Arguments, network: string, coverage: boolean, verbose: number): Promise<void> {
  info(`Saddle: running contract ${coverage ? 'coverage' : 'tests'} with jest...\n`, verbose);
  info(`Saddle: Using network: ${network || 'test'}`, verbose);
  info(`Saddle: Using hardhat: ${!!process.env['USE_HARDHAT']}`, verbose);

  // Parse the saddle config
  const config = await loadConfig();

  if (argv._[0] == 'coverage') {
    argv._[0] = 'test';
  }

  // Parse command line args, possibly override testMatch based on remaining argv
  let jestArgv = buildArgv(argv._);
  const testArgs = argv._[0] == 'test' ? argv._.slice(1) : argv._;
  const testPats = testArgs.map(a => `**/${a}`);

  jestArgv = { ...jestArgv, verbose: true, silent: false };
  info(`Jest args: ${JSON.stringify(jestArgv)}`, verbose);

  const res = await jest.runCLI({
    testMatch: testPats.length ? testPats : config.tests,
    testEnvironment: path.join(__dirname, '..', '..', 'test_env.js'),
    testEnvironmentOptions: { network, coverage: coverage.toString() },
    ...jestArgv
  }, [process.cwd()]);

  if (!res.results.success) {
    process.exitCode = 1;
  }
}
