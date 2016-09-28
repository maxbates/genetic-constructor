import Promise from 'bluebird';
import { writeFile } from './lib/fs';
import mkdirp  from 'mkdirp';
import pkg from '../package.json';
/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function copy() {
  const ncp = Promise.promisify(require('ncp'));
  const glob = Promise.promisify(require('glob'));

  await Promise.all([
    //public assets
    ncp('src/public', 'build/public'),

    //static page content
    ncp('src/images', 'build/images'),
    ncp('src/content', 'build/content'),

    //todo - dynamically get the version number
    ncp(`docs/jsdoc/genetic-constructor/${pkg.version}`, 'build/jsdoc'),

    //copy installed extensions
    ncp('server/extensions/node_modules', 'build/node_modules'),

    //copy python scripts used by those extensions, relative to extension root
    glob('server/extensions/**/*.py', function pythonGlob(err, files) {
      return Promise.all(files.map(file => {
        const [ server, extensions, type, name, ...splitPath] = file.split('/');

        const filePath = splitPath.join('/');
        const fileDir = splitPath.slice(0, -1).join('/');
        const buildPath = 'build/' + filePath;

        if (!!fileDir) {
          mkdirp.sync('build/' + fileDir);
        }

        return ncp(file, buildPath);
      }));
    }),
  ]);

  await writeFile('./build/package.json', JSON.stringify({
    private: true,
    engines: pkg.engines,
    dependencies: pkg.dependencies,
    scripts: {
      start: 'node server.js',
    },
  }, null, 2));
}

export default copy;
