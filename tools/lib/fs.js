import fs from 'fs';
import mkdirp from 'mkdirp';

export const writeFile = (file, contents) => new Promise((resolve, reject) => {
  fs.writeFile(file, contents, 'utf8', err => err ? reject(err) : resolve()); //eslint-disable-line no-confusing-arrow
});

export const makeDir = name => new Promise((resolve, reject) => {
  mkdirp(name, err => err ? reject(err) : resolve()); //eslint-disable-line no-confusing-arrow
});
