import { exists, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env, exit } from 'node:process';

import { catchError, defer, forkJoin, of, switchMap, tap, throwError } from 'rxjs';

import { completePackage } from './completePackage';
import { logError, logErrorMessage, logLikeError, logSuccessMessage, rxSpawn } from './utils';

const commonFlags = [
  '--project', 'tsconfig.lib.json',
];

const cjsFlags = (outDir: string) => [
  ...commonFlags,
  '--declaration', 'false',
  '--module', 'commonjs',
  '--outDir', resolve(outDir, 'cjs'),
];

const esmFlags = (outDir: string) => [
  ...commonFlags,
  '--declaration', 'true',
  '--declarationDir', resolve(outDir, 'types'),
  '--module', 'esnext',
  '--outDir', resolve(outDir, 'esm'),
];

export function build(
  workDir: string,
  packageName: string,
  pathToPackageArtifacts: string,
): void {
  const packageDir = resolve(workDir, pathToPackageArtifacts, packageName);

  of(packageDir)
    .pipe(
      switchMap(() => (
        defer(() => exists(packageDir)).pipe(
          switchMap((dirExists) => (dirExists ? rm(packageDir, { recursive: true }) : of(null))),
          switchMap(() => mkdir(packageDir, { recursive: true })),
        )
      )),
      switchMap(() => (
        forkJoin([
          rxSpawn('tsc', esmFlags(packageDir), { cwd: workDir, env }).pipe(
            catchError((error: string) => {
              logLikeError(error);
              return throwError(() => new Error('Failed to build ESM version of the package'));
            }),
            tap(() => logSuccessMessage('ESM version of the package successfully created')),
          ),
          rxSpawn('tsc', cjsFlags(packageDir), { cwd: workDir, env }).pipe(
            catchError((error: string) => {
              logLikeError(error);
              return throwError(() => new Error('Failed to build CJS version of the package'));
            }),
            tap(() => logSuccessMessage('CJS version of the package successfully created')),
          ),
        ])
      )),
      switchMap(() => completePackage(workDir, packageDir, packageName).pipe(
        catchError((error: string) => {
          logLikeError(error);
          return throwError(() => new Error('Failed to create production version of package.json'));
        }),
        tap(() => logSuccessMessage('Production version of package.json successfully created')),
      )),
      catchError((error) => {
        logError(error);
        logLikeError('Building package is failed, removing artifacts...');
        return defer(() => rm(packageDir, { recursive: true })).pipe(
          switchMap(() => throwError(() => new Error('Build failed'))),
        );
      }),
    )
    .subscribe({
      error: (error) => {
        logErrorMessage(error.message);
        exit(1);
      },
      complete: () => {
        logSuccessMessage('Build successfully completed!');
        exit(0);
      },
    });
}
