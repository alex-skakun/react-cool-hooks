import { SpawnOptions } from 'child_process';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

import chalk from 'chalk';
import {
  combineLatestWith,
  defaultIfEmpty,
  filter,
  forkJoin,
  fromEvent,
  fromEventPattern,
  map,
  merge,
  Observable,
  of,
  Subscription,
  switchMap,
  take,
  takeUntil,
  toArray,
} from 'rxjs';

import { PackageJson } from 'type-fest';

export function src(path: string): string {
  return resolve(cwd(), path);
}

export function readFileAsText(filePath: string): Promise<string> {
  return readFile(src(filePath), { encoding: 'utf-8' });
}

export function writeFileAsText(filePath: string, text: string): Promise<void> {
  return writeFile(src(filePath), text, { encoding: 'utf-8' });
}

export function parsePackageJson(pathToJson: string): Promise<Record<string, any>> {
  return readFileAsText(pathToJson).then((jsonText) => JSON.parse(jsonText));
}

export function alterPackage(pathToJson: string, patch: Partial<PackageJson>): Promise<void> {
  return parsePackageJson(pathToJson)
    .then((packageJson) => ({
      ...packageJson,
      ...patch,
    }))
    .then((updated) => JSON.stringify(updated, null, 2))
    .then((jsonContent) => writeFileAsText(pathToJson, jsonContent));
}

export const semVerPattern = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildMetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export interface SemVer {
  major: string;
  minor: string;
  patch: string;
  prerelease?: string;
  buildMetadata?: string;
}

export function isValidVersion(inputVersion?: string): inputVersion is string {
  if (!inputVersion) {
    return false;
  }

  return semVerPattern.test(inputVersion);
}

export function bumpVersion(version: string): string {
  const {
    major,
    minor,
    patch,
    prerelease,
  } = semVerPattern.exec(version)!.groups as unknown as SemVer;

  return `${
    major
  }.${
    minor
  }.${
    Number(patch) + 1
  }${
    prerelease
      ? `-${prerelease}`
      : ''
  }`;
}

export function rxSpawn(command: string, args: string[], options: SpawnOptions): Observable<string> {
  return new Observable<string>((observer) => {
    const abortController = new AbortController();
    const childProcess = spawn(command, args, { ...options, signal: abortController.signal });
    const subscription = new Subscription();

    const stdError$ = of(childProcess.stderr).pipe(
      filter(Boolean),
      switchMap((stderr) => {
        const data$ = fromEvent(stderr, 'data');
        const end$ = fromEvent(stderr, 'end');

        return data$.pipe(
          filter(Boolean),
          takeUntil(end$),
          toArray(),
          map((rows) => rows.join('\n')),
        );
      }),
    );

    const stdOut$ = of(childProcess.stdout).pipe(
      filter(Boolean),
      switchMap((stdout) => {
        const data$ = fromEvent(stdout, 'data');
        const end$ = fromEvent(stdout, 'end');

        return data$.pipe(
          filter(Boolean),
          takeUntil(end$),
          toArray(),
          map((rows) => rows.join('\n')),
        );
      }),
    );

    const close$ = merge(
      fromEventPattern<[code: number | null, signal: NodeJS.Signals | null]>(
        (handler) => childProcess.on('exit', handler),
        (handler) => childProcess.off('exit', handler),
      ),
      fromEventPattern<[code: number | null, signal: NodeJS.Signals | null]>(
        (handler) => childProcess.on('close', handler),
        (handler) => childProcess.off('close', handler),
      ),
    );

    subscription.add(
      fromEventPattern<Error>(
        (handler) => childProcess.on('error', handler),
        (handler) => childProcess.off('error', handler),
      )
        .pipe(
          map((error: Error) => prepareErrorMessage(error)),
        )
        .subscribe((errorMessage) => {
          observer.error(errorMessage);
        }),
    );

    subscription.add(
      forkJoin([
        stdOut$,
        stdError$,
      ])
        .pipe(
          combineLatestWith(close$.pipe(take(1))),
        )
        .subscribe(([[stdOutput, stdError], [code]]) => {
          switch (code) {
            case 0:
              observer.next(stdOutput);
              observer.complete();
              return;
            case 1:
            default:
              observer.error(stdError || stdOutput);
          }
        }),
    );

    return () => {
      abortController.abort();
      subscription.unsubscribe();
    };
  }).pipe(
    defaultIfEmpty(''),
  );
}

export function logSuccessMessage(message: string): void {
  console.log(
    chalk.bgGreenBright.black.bold(' SUCCESS '),
    chalk.greenBright.bold(message),
  );
}

export function logErrorMessage(message: string): void {
  console.log(
    chalk.bgRedBright.whiteBright.bold(' ERROR '),
    chalk.redBright.bold(message),
  );
}

export function logLikeSuccess(message: string): void {
  console.log(chalk.greenBright(message));
}

export function logLikeInfo(message: string): void {
  console.log(chalk.blueBright(message));
}

export function logLikeError(message: string): void {
  console.log(chalk.redBright(message));
}

export function prepareErrorMessage(error: Error): string {
  return `${chalk.bgRedBright.whiteBright.bold(' ERROR ')} ${chalk.redBright.bold(error.message)}\n${
    chalk.redBright(
      error.stack?.trim()
        .split(/\s*\n+\s*/)
        .slice(1)
        .map((line) => `\t${line.trim()}`)
        .join('\n'),
    )
  }`;
}

export function logError(error: Error): void {
  console.log(prepareErrorMessage(error));
}
