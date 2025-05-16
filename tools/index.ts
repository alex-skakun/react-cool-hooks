import { Command } from 'commander';

import { build } from './build';
import { publish } from './publish';
import { src } from './utils';

const program = new Command();
const workDir = src('.');
const packageName = workDir.split('/').at(-1) as string;

program
  .name('lib tools');

program.command('publish')
  .description('Publishes package into registry')
  .argument('<dirWithPackage>', 'Path to directory with a package')
  .argument('[version]', 'Version that should be assigned into package before publish')
  .action((dirWithPackage: string, version: string) => {
    publish(workDir, packageName, dirWithPackage, version);
  });

program.command('build')
  .description('Builds library package')
  .argument('<pathToPackageArtifacts>', 'Path ro directory where put built artifacts')
  .action((pathToPackageArtifacts: string) => {
    build(workDir, packageName, pathToPackageArtifacts);
  });

program.parse();
