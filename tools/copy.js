import Promise from 'bluebird';
import { writeFile } from './lib/fs';
import pkg from '../package.json';
/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function copy() {
  try {
    const ncp = Promise.promisify(require('ncp'));

    //public assets
    console.log('Copying public assets...');
    await ncp('src/public', 'build/public');

    //static page content
    console.log('Copying static content...');
    await ncp('src/images', 'build/images');
    await ncp('src/content', 'build/content');

    //docs
    console.log('Copying documentation...');
    try {
      await ncp(`docs/jsdoc/genetic-constructor/${pkg.version}`, 'build/jsdoc');
    } catch (err) {
      console.log('Docs not generated... run npm install');
      throw err;
    }

    //copy installed extensions
    console.log('Copying extensions...');
    await ncp('server/extensions/node_modules', 'build/node_modules');

    await writeFile('./build/package.json', JSON.stringify({
      private: true,
      engines: pkg.engines,
      dependencies: pkg.dependencies,
      scripts: {
        start: 'node server.js',
      },
    }, null, 2));
  } catch (err) {
    console.log('Error Running Copy...');
    throw err;
  }
}

export default copy;
