import webpack from 'webpack';
import { clientConfig, commonsConfig } from './webpack.config';

//Creates application bundles from the source files.
async function bundle() {
  console.log('Bundling client...');

  await new Promise((resolve, reject) => {
    webpack(clientConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.log(stats.toString(clientConfig.stats));
      return resolve();
    });
  });

  console.log('Bundling commons...');

  await new Promise((resolve, reject) => {
    webpack(commonsConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.log(stats.toString(commonsConfig.stats));
      return resolve();
    });
  });
}

export default bundle;
