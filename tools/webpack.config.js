import path from 'path';
import fs from 'fs';
import { find, merge } from 'lodash';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const DEBUG = !process.argv.includes('--release');
const VERBOSE = process.argv.includes('--verbose');
const DEBUG_REDUX = !!process.env.DEBUG_REDUX || (process.env.DEBUG && process.env.DEBUG.indexOf('redux') >= 0); //hook for devtools etc.

const AUTOPREFIXER_BROWSERS = [
  'Android 2.3',
  'Android >= 4',
  'Chrome >= 35',
  'Firefox >= 31',
  'Explorer >= 9',
  'iOS >= 7',
  'Opera >= 12',
  'Safari >= 7.1',
];

//folder paths
const dataPath = path.resolve(__dirname, '../data');
const sourcePath = path.resolve(__dirname, '../src');
const serverSourcePath = path.resolve(__dirname, '../server');
const buildPath = path.resolve(__dirname, '../build');
const classesModulePath = path.resolve(__dirname, '../constructor-classes');
const commonsPath = path.resolve(__dirname, '../commons');

const GLOBALS = {
  'process.env.NODE_ENV': DEBUG ? '"dev"' : '"production"',
  __DEV__: DEBUG,
  'process.env.BUILD': true,
  'process.env.DEBUG_REDUX': DEBUG_REDUX,
};

//get list of node modules for webpack to avoid bundling on server
const nodeModules = fs.readdirSync('node_modules')
.filter(x => ['.bin'].indexOf(x) === -1)
.reduce(
  (acc, mod) => Object.assign(acc, { [mod]: true }),
  {},
);

const clientSidePlugins = [
  // Assign the module and chunk ids by occurrence count
  // https://webpack.github.io/docs/list-of-plugins.html#occurrenceorderplugin
  new webpack.optimize.OccurenceOrderPlugin(true),

  //Print errors, don't allow modules with errors
  //https://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
  new webpack.NoErrorsPlugin(),

  // Define free variables
  // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
  new webpack.DefinePlugin({
    ...GLOBALS,
    'process.env.BROWSER': true,
  }),
  ...(DEBUG ? [] : [
      // Search for equal or similar files and deduplicate them in the output
      // https://webpack.github.io/docs/list-of-plugins.html#dedupeplugin
    new webpack.optimize.DedupePlugin(),

      // Minimize all JavaScript output of chunks
      // https://github.com/mishoo/UglifyJS2#compressor-options
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true, // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
        warnings: VERBOSE,
      },
    }),

      // A plugin for a more aggressive chunk merging strategy
      // https://webpack.github.io/docs/list-of-plugins.html#aggressivemergingplugin
    new webpack.optimize.AggressiveMergingPlugin(),
  ]),
];

//common configuration
export const config = {
  output: {
    path: buildPath,
    publicPath: '/static/',
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader!postcss-loader',
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        //explicitly declare folders
        include: [
          classesModulePath,
          sourcePath,
          serverSourcePath,
          commonsPath,
          dataPath,
        ],
        exclude: /node_modules/,
        query: {
          // https://github.com/babel/babel-loader#options
          cacheDirectory: DEBUG,

          presets: ['stage-2', 'react', 'es2015'],
          plugins: ['transform-class-properties', 'transform-decorators-legacy', 'add-module-exports', 'transform-runtime'],
        },
      },
      {
        test: /\.jade$/,
        loader: 'jade-loader',
      },
      {
        test: /\.svg/,
        loader: 'svg-url-loader',
      },
    ],
  },

  resolve: {
    root: sourcePath,
    modulesDirectories: ['node_modules'],
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.json'],
  },

  cache: DEBUG,
  debug: DEBUG,

  stats: {
    colors: true,
    reasons: DEBUG,
    hash: VERBOSE,
    version: VERBOSE,
    timings: true,
    chunks: VERBOSE,
    chunkModules: VERBOSE,
    cached: VERBOSE,
    cachedAssets: VERBOSE,
  },

  postcss: function plugins(bundler) {
    return [
      require('postcss-import')({ addDependencyTo: bundler }),
      require('postcss-nested')(),
      require('postcss-cssnext')({ autoprefixer: AUTOPREFIXER_BROWSERS }),
    ];
  },
};

export const clientConfig = merge({}, config, {
  context: sourcePath,

  entry: [
    './index.js',
  ],

  output: {
    filename: 'client.js',
    //filename: DEBUG ? '[name].js?[chunkhash]' : '[name].[chunkhash].js',
    //chunkFilename: DEBUG ? '[name].[id].js?[chunkhash]' : '[name].[id].[chunkhash].js',
  },

  target: 'web',

  plugins: clientSidePlugins,

  // Choose a developer tool to enhance debugging
  // http://webpack.github.io/docs/configuration.html#devtool
  devtool: DEBUG ? 'inline-source-map' : false,
});

export const serverConfig = merge({}, config, {
  context: serverSourcePath,
  entry: './server.js',

  resolve: {
    root: serverSourcePath,
    alias: {
      gd_extensions: `${buildPath}/node_modules`,
    },
  },

  output: {
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },

  target: 'node',

  plugins: [
    //this will ignore in webpack, but not babel-node
    //new webpack.NormalModuleReplacementPlugin(/\.css$/, 'node-noop'),

    new webpack.optimize.OccurenceOrderPlugin(true),

    // Define free variables
    // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({
      ...GLOBALS,
      'process.env.BROWSER': false,
    }),

    new webpack.NoErrorsPlugin(),

    // Adds a banner to the top of each generated chunk
    // https://webpack.github.io/docs/list-of-plugins.html#bannerplugin
    new webpack.BannerPlugin('require("source-map-support").install();',
      { raw: true, entryOnly: false }),
  ],

  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
  },

  externals: nodeModules,

  devtool: 'cheap-module-source-map',
});

//todo - not sure if this will work on the client
export const classesConfig = merge({}, config, {
  context: classesModulePath,

  entry: './bundle.js',

  output: {
    filename: 'index.js',
    path: classesModulePath,
    libraryTarget: 'commonjs2',
  },

  target: 'node',

  plugins: clientSidePlugins,

  node: serverConfig.node,

  externals: {},

  devtool: 'cheap-module-source-map',
});

export const commonsConfig = merge({}, clientConfig, {
  context: commonsPath,
  resolve: { root: commonsPath },

  entry: [
    './app/client.js',
  ],

  output: {
    filename: 'commons.js',
  },
});

//update commons config to extract CSS into separate stylesheet
//todo - this prevents SVGs from bundling with rest of code
const cssExtractor = new ExtractTextPlugin('commons.css');
commonsConfig.plugins.push(cssExtractor);
const loader = find(commonsConfig.module.loaders, mod => mod.loader.startsWith('style'));
merge(loader, {
  loader: cssExtractor.extract(['css', 'postcss']),
});

export default [clientConfig, commonsConfig, serverConfig];
