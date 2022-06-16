import {copyFile, readdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {cwd} from 'node:process';


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
    readFile(resolve(cwd(), '.gitignore'), {encoding: 'utf-8'}),
    readFile(resolve(cwd(), '.npmignore'), {encoding: 'utf-8'}),
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
        return readdir(cwd())
            .then(workingDirFiles => {
                return workingDirFiles.filter(file => {
                    return !filter.some(ignore => ignore.test(file));
                });
            });
    })
    .then(filesForCopy => {
        return Promise.all(filesForCopy.map(file => {
            return copyFile(resolve(cwd(), file), resolve(cwd(), `./dist/${file}`));
        }));
    })
    .then(() => {
        return readFile(resolve(cwd(), `./dist/package.json`), {encoding: 'utf-8'});
    })
    .then(jsonFile => JSON.parse(jsonFile))
    .then(packageContent => {
        delete packageContent.scripts;
        return {
            ...packageContent,
            ...packageExtension,
        };
    })
    .then(updatedPackage => JSON.stringify(updatedPackage, null, 2))
    .then(jsonFile => {
        return writeFile(resolve(cwd(), `./dist/package.json`), jsonFile, {encoding: 'utf-8'});
    });
