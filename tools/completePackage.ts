import { copyFile, readdir, exists } from 'node:fs/promises';
import { resolve } from 'node:path';

import { asyncScheduler, catchError, defer, forkJoin, map, mergeMap, Observable, of, scheduled, switchMap, toArray } from 'rxjs';

import { alterPackage, readFileAsText } from './utils';

const propertiesToRemove = [
  'scripts',
  'nx',
  'jestSonar',
];

const packageExtension = {
  main: './cjs/index.js',
  module: './esm/index.js',
  types: './types/index.d.ts',
  exports: {
    '.': {
      types: './types/index.d.ts',
      node: './cjs/index.js',
      require: './cjs/index.js',
      default: './esm/index.js',
    },
    './package.json': './package.json',
  },
};

export function completePackage(
  workDir: string,
  packageDir: string,
  packageName: string,
) {
  const rootDir = resolve(workDir, '.');
  const gitIgnorePath = resolve(rootDir, '.gitignore');
  const npmIgnorePath = resolve(workDir, '.npmignore');

  return forkJoin([
    safelyReadFileAsText(gitIgnorePath),
    safelyReadFileAsText(npmIgnorePath),
  ])
    .pipe(
      map((fileLists) => (
        fileLists
          .flatMap((fileList) => fileList.split(/\s*\n+\s*/))
          .filter((fileEntry) => !/^#/.test(fileEntry))
      )),
      map((filesToIgnore) => (
        filesToIgnore.map((pattern) => new RegExp(`^${pattern.replace(/\*/g, '.+?')}$`))
      )),
      switchMap((fileFilter) => (
        defer(() => readdir(workDir)).pipe(
          map((workDirFiles) => (
            workDirFiles.filter((filePath) => !fileFilter.some((ignorePattern) => (
              ignorePattern.test(filePath)
            )))
          )),
        )
      )),
      switchMap((filesToCopy) => (
        scheduled(filesToCopy, asyncScheduler).pipe(
          mergeMap((file) => (
            copyFile(resolve(workDir, file), resolve(packageDir, file))
          ), 3),
          toArray(),
        )
      )),
      switchMap(() => alterPackage(resolve(packageDir, 'package.json'), {
        ...Object.fromEntries(propertiesToRemove.map((property) => [property, undefined])),
        ...packageExtension,
        name: packageName,
      })),
    );
}

function safelyReadFileAsText(path: string): Observable<string> {
  return defer(() => exists(path)).pipe(
    switchMap((npmIgnoreExists) => (npmIgnoreExists ? readFileAsText(path) : of(''))),
    catchError(() => of('')),
  );
}
