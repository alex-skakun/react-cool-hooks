import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env, exit } from 'node:process';

import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { catchError, defer, map, of, switchMap, tap, throwError } from 'rxjs';

import {
  alterPackage,
  bumpVersion,
  isValidVersion,
  logError,
  logLikeError,
  logLikeInfo,
  logLikeSuccess,
  logSuccessMessage,
  rxSpawn,
} from './utils';

import { PackageJson } from 'type-fest';

const publishFlags = () => [
  '--dry-run',
];

export function publish(
  workDir: string,
  packageName: string,
  dirWithPackage: string,
  version?: string,
): void {
  const packageDir = resolve(workDir, dirWithPackage, packageName);

  defer(() => readFile(resolve(packageDir, 'package.json')))
    .pipe(
      map((packageFileContent) => JSON.parse(packageFileContent.toString())),
      switchMap((packageInfo: PackageJson) => (
        defer(() => getAcceptedVersion(packageInfo.version, version)).pipe(
          switchMap((acceptedVersion) => (
            of(acceptedVersion).pipe(
              tap(() => logLikeInfo(`Accepted version is ${chalk.underline.bold(acceptedVersion)}`)),
              switchMap(() => alterPackage(resolve(packageDir, 'package.json'), {
                version: acceptedVersion,
              })),
              tap(() => logLikeSuccess('Version in package.json successfully updated')),
              tap(() => logLikeInfo('Publishing...')),
              switchMap(() => (
                rxSpawn('npm', ['publish', ...publishFlags()], { cwd: packageDir, env }).pipe(
                  catchError((error: string) => {
                    console.log(error);
                    return throwError(() => new Error('Failed to publish package'));
                  }),
                  tap(() => logSuccessMessage(`Package "${packageInfo.name}@${acceptedVersion}" successfully published!`)),
                )
              )),
              switchMap(() => alterPackage(resolve(workDir, 'package.json'), {
                version: acceptedVersion,
              })),
            )
          )),
        )
      )),
    )
    .subscribe({
      error: (error) => {
        logError(error);
        exit(1);
      },
      complete: () => {
        logSuccessMessage('Completed');
        exit(0);
      },
    });
}

async function getAcceptedVersion(currentVersion: string | undefined, version?: string): Promise<string> {
  while (!isValidVersion(version)) {
    if (version) {
      logLikeError(`Provided version ${chalk.underline.bold(version)} is invalid semantic version`);
    }

    version = await input({
      message: `Enter version ${chalk.dim(`(current version is ${chalk.underline(currentVersion)})`)}`,
      default: bumpVersion(currentVersion ?? '0.0.0'),
    });
  }

  return version as string;
}
