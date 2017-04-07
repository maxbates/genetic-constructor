import BrowserSync from 'browser-sync';
import webpack from 'webpack';
import colors from 'colors/safe';
import { debounce } from 'lodash';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import run from './run';
import runServer from './runServer';
import setup from './setup';
import { clientConfig, commonsConfig } from './webpack.config';
//import bundleServer from './bundleServer';

const DEBUG = !process.argv.includes('--release');

let processes = [];

async function start() {
  try {
    if (!process.env.CONSTRUCTOR_SKIP_SETUP) {
      processes = await run(setup);
    }

    console.log(colors.blue(`Bundling application with Webpack [${DEBUG ? 'dev' : 'release'}] (this may take a moment)...`));

    const clientConfigs = [clientConfig, commonsConfig];

    await new Promise((resolve, reject) => {
      // Patch the client-side bundle configurations
      // to enable Hot Module Replacement (HMR) and React Transform
      clientConfigs.forEach((config) => {
        /* eslint-disable no-param-reassign */
        if (Array.isArray(config.entry)) {
          config.entry.unshift('webpack/hot/dev-server', 'webpack-hot-middleware/client');
        } else {
          config.entry = [
            'webpack/hot/dev-server',
            'webpack-hot-middleware/client',
            config.entry,
          ];
        }

        config.plugins.push(new webpack.HotModuleReplacementPlugin());
        config.plugins.push(new webpack.NoErrorsPlugin());
        config
        .module
        .loaders
        .filter(x => x.loader === 'babel-loader')
        .forEach(x => (x.query = {
          ...x.query,

          // Wraps all React components into arbitrary transforms
          // https://github.com/gaearon/babel-plugin-react-transform
          plugins: [
            ...(x.query ? x.query.plugins : []),
            ['react-transform', {
              transforms: [
                {
                  transform: 'react-transform-hmr',
                  imports: ['react'],
                  locals: ['module'],
                }, {
                  transform: 'react-transform-catch-errors',
                  imports: ['react', 'redbox-react'],
                },
              ],
            },
            ],
          ],
        }));
        /* eslint-enable no-param-reassign */
      });

      //todo - build server, better reloading for server
      //const clientCompiler = webpack([clientConfig, serverConfig]);

      const clientCompiler = webpack(clientConfigs);
      const clientDevMiddleware = webpackDevMiddleware(clientCompiler, {
        publicPath: clientConfig.output.publicPath,
        stats: clientConfig.stats.colors,
      });
      const hotMiddleware = webpackHotMiddleware(clientCompiler);

      const debouncedRunServer = debounce(runServer, 100);

      //need to essentially build twice so that browsersync starts with a valid bundle
      //use browsersync and its proxy so that we dont need to explicitly include it in server code, only when debugging...
      //also allows us to watch static assets
      let handleBundleComplete = () => {
        console.log('webpack initial build complete');
        console.log('Starting Browser-Sync proxy & injecting Webpack middleware...');

        runServer((err, host) => {
          if (err) {
            console.log(colors.red('Error running server'));
            return reject(err);
          }

          const bs = BrowserSync.create();

          bs.init({
            // no need to watch *.js, webpack will take care of it for us
            // no need to watch *.css, since imported so webpack will handle
            files: [
              'src/content/**/*.*',
              //todo - webpack server, let webpack handle watching
            ],

            //dont sync events
            ghostMode: false,

            ...(DEBUG ? {} : { notify: false, ui: false }),

            proxy: {
              target: host,
              middleware: [
                clientDevMiddleware,
                hotMiddleware,
              ],
            },
          }, () => {
            //if we're not in production, create EGF project and publish it before resolving
            if (process.env.NODE_ENV !== 'production') {
              const publishEgfLocally = require('../data/egf_parts/publishEgfLocally');
              return resolve(publishEgfLocally());
            }

            resolve();
          });

          const ignoreDotFilesAndNestedNodeModules = /([/\\]\.)|(node_modules\/.*?\/node_modules)/gi;
          const checkSymlinkedNodeModule = /(.*?\/)?extensions\/.*?\/node_modules/;
          const checkIsInServerExtensions = /^server\//;
          const checkTempFile = /temp/gi;

          const ignoreFilePathCheck = (path) => {
            if (ignoreDotFilesAndNestedNodeModules.test(path)) {
              return true;
            }
            //ignore jetbrains temp filesystem
            if (/__jb_/ig.test(path)) {
              return true;
            }
            //ignore compiled python
            if (/\.pyc$/.test(path)) {
              return true;
            }
            //ignore node_modules for things in the root server/extensions/ folder
            //additional check needed to handle symlinked files (nested node modules wont pick this up in symlinks)
            //ugly because javascript doesnt support negative lookaheads
            if (checkSymlinkedNodeModule.test(path) && checkIsInServerExtensions.test(path)) {
              return true;
            }
            if (checkTempFile.test(path)) {
              return true;
            }
            return false;
          };

          const eventsCareAbout = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'];
          const handleChange = (evt, path, stat) => {
            if (ignoreFilePathCheck(path)) {
              return;
            }
            if (eventsCareAbout.includes(evt)) {
              console.log(colors.yellow('webpack watch:', evt, path));
              debouncedRunServer();
            }
          };

          //while we are not bundling the server, we can set up a watch to recompile on changes
          //note this does not pick up changes to files in the bundle, just files in these directories
          const watcher = bs.watch('{commons,server}/**/*', {
            followSymLinks: true,
            ignored: ignoreFilePathCheck,
          });

          //wait for initial scan to complete then listen for events
          watcher.on('ready', () => watcher.on('all', handleChange));

          //reassign so that we arent creating multiple browsersync entities, or rebuilding over and over
          handleBundleComplete = () => {};
        });
      };

      // middleware will initiate the build for us, we dont need to explicit run()
      // if we do, might call handleServerBundleComplete twice (because two calls before browsersync set up)

      clientCompiler.plugin('failed', (err) => {
        console.log(colors.bgRed('Error creating webpack bundle!'));
        throw err;
      });
      clientCompiler.plugin('done', () => handleBundleComplete());

      /*
       console.info('beginning webpack build');
       clientCompiler.run((err) => {
       if (err) throw err;
       });
       */
    });
  } catch (err) {
    console.log(colors.bgRed('Error Running Constructor...'));
    throw err;
  }
}

const handleTermination = () => {
  processes.forEach(proc => proc.kill('SIGTERM'));
  process.exit(0);
};

process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

export default start;
