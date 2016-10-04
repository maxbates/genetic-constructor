import Promise from 'bluebird';
import { writeFile } from './lib/fs';
import pkg from '../package.json';
/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function copy() {
  const ncp = Promise.promisify(require('ncp'));

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
