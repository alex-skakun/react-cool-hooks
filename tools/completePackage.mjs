import { copyFile, readdir } from 'node:fs/promises';
import {
  execCommand,
  LOCAL_REGISTRY,
  parsePackageJson,
  readFileAsText,
  src,
  writeFileAsText,
} from './shared.mjs';


const packageExtension = {
  main: './cjs/index.js',
  module: './esm/index.js',
  es2015: './esm/index.js',
  types: './types/index.d.ts',
  exports: {
    '.': {
      types: './types/index.d.ts',
      node: './cjs/index.js',
      require: './cjs/index.js',
      es2015: './esm/index.js',
      default: './esm/index.js',
    },
    './package.json': './package.json',
  },
};

Promise.all([
  readFileAsText('.gitignore'),
  readFileAsText('.npmignore'),
])
  .then((fileLists) => {
    return fileLists
      .map(fileList => fileList.split(/\s*\n+\s*/))
      .flat()
      .filter(item => !/^#/.test(item));
  })
  .then(ignoredFilesList => {
    return ignoredFilesList.map(source => {
      return new RegExp(`^${source.replace(/\*/g, '.+?')}$`);
    });
  })
  .then(filter => {
    return readdir(src(''))
      .then(workingDirFiles => {
        return workingDirFiles.filter(file => {
          return !filter.some(ignore => ignore.test(file));
        });
      });
  })
  .then(filesForCopy => {
    return Promise.all(filesForCopy.map(file => {
      return copyFile(src(file), src(`./dist/${file}`));
    }));
  })
  .then(() => {
    return parsePackageJson(`./dist/package.json`);
  })
  .then(packageJson => {
    const localDeps = packageJson.localDevDependencies;

    return !localDeps || !localDeps.length ? Promise.resolve(packageJson) : Promise.all(
      packageJson.localDevDependencies.map(packageName => {
        return execCommand(`npm show ${packageName} versions --json --registry ${LOCAL_REGISTRY}`)
          .then(versionsJson => JSON.parse(versionsJson))
          .then(versions => [
            packageName,
            `^${
              (Array.isArray(versions) ? versions.pop() : versions).replace(/\d+$/, '0')
            }`
          ]);
      }),
    )
      .then(entries => Object.fromEntries(entries))
      .then(localDependencies => {
        delete packageJson.localDevDependencies;
        delete packageJson.scripts;
        delete packageJson.config;

        packageJson.dependencies = {
          ...(packageJson.dependencies ?? {}),
          ...localDependencies,
        };

        return {
          ...packageJson,
          ...packageExtension,
        };
      });
  })
  .then(updatedPackage => JSON.stringify(updatedPackage, null, 2))
  .then(jsonFile => {
    return writeFileAsText(`./dist/package.json`, jsonFile);
  })
  .then(
    () => console.log('UPDATED'),
    (err) => {
      console.error('FAILED');
      console.error(err);
    }
  );
