import { exec } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import json from '../package.json' assert { type: 'json' };


export const LOCAL_REGISTRY = json.config.localRegistry;

/**
 * @param {string} command
 * @return {Promise<string>}
 */
export function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout);
    });
  });
}

/**
 * @param {string} path
 * @return {string}
 */
export function src(path) {
  return resolve(cwd(), path);
}

/**
 * @param {string} filePath
 * @return {Promise<string>}
 */
export function readFileAsText(filePath) {
  return readFile(src(filePath), { encoding: 'utf-8' });
}

/**
 * @param {string} filePath
 * @param {string} text
 * @return {Promise<string>}
 */
export function writeFileAsText(filePath, text) {
  return writeFile(src(filePath), text, { encoding: 'utf-8' });
}

/**
 * @typedef PackageJSON
 * @type {{ localDevDependencies: string[], scripts: object, dependencies: object }}
 */

/**
 * @param {string} pathToJson
 * @return {Promise<PackageJSON>}
 */
export function parsePackageJson(pathToJson) {
  return readFileAsText(pathToJson)
    .then((jsonText) => {
      return JSON.parse(jsonText);
    });
}
