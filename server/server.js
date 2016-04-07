import path from 'path';
import fs from 'fs';
import express from 'express';
import morgan from 'morgan';

import dataRouter from './data/index';
import fileRouter from './file/index';
import extensionsRouter from './extensions/index';

import computeRouter from '../plugins/compute/api';
import importRouter from '../plugins/convert/import';
import exportRouter from '../plugins/convert/export';
import searchRouter from '../plugins/search/search';

const DEFAULT_PORT = 3000;
const port = parseInt(process.argv[2], 10) || process.env.PORT || DEFAULT_PORT;
const hostname = '0.0.0.0';

//file paths depending on if building or not
//note that currently, you basically need to use npm run start in order to serve the client bundle + webpack middleware
const createBuildPath = (isBuild, notBuild = isBuild) => {
  return path.join(__dirname, (process.env.BUILD ? isBuild : notBuild));
};
const pathContent = createBuildPath('content', '../src/content');
const pathImages = createBuildPath('images', '../src/images');
const pathPublic = createBuildPath('public', '../src/public');
const pathClientBundle = createBuildPath('client.js');

const app = express();

//error logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use((err, req, res, next) => {
    console.log('hit error logging middleware', err, req, res, next);
    if (err) {
      console.error(err);
      if (res.headersSent) {
        return next(err);
      }
      res.status(502).send(err);
    }
    return next();
  });
}

//HTTP logging middleware
app.use(morgan('dev', {
  skip: (req, res) => req.path.indexOf('browser-sync') >= 0,
}));

// view engine setup
app.set('views', pathContent);
app.set('view engine', 'jade');

// Register API middleware
// ----------------------------------------------------

// insert some form of user authentication
// the auth routes are currently called from the client and expect JSON responses
if (process.env.BIO_NANO_AUTH) {
  console.log("real user authentication enabled");
  var initAuthMiddleware = require('bio-user-platform').initAuthMiddleware;

  // TODO load a custom configuration here
  // disable all redirects
  var authConfig = {
    logoutLanding: false,
    loginLanding: false,
    loginFailure: false,
    apiEndPoint: process.env.API_END_POINT || "http://localhost:8080/api",
  };
  app.use(initAuthMiddleware(authConfig));
} else {
  app.use(require('cookie-parser')());
  // import the mocked auth routes
  app.use(require('./auth/local').mockUser);
  const authRouter = require('./auth/local').router;
  app.use('/auth', authRouter);
}

//primary routes
app.use('/data', dataRouter);
app.use('/file', fileRouter);
app.use('/extensions', extensionsRouter);

//hardwired extensions
app.use('/compute', computeRouter);
app.use('/import', importRouter);
app.use('/export', exportRouter);
app.use('/search', searchRouter);

// Register Client Requests, delegate routing to client
// ----------------------------------------------------

//Static Files
app.use(express.static(pathPublic));
app.use('/images', express.static(pathImages));

app.get('/version', (req, res) => {
  try {
    //this is only relevant when the server builds, so can assume always at same path relative to __dirname
    const version = fs.readFileSync(path.join(__dirname, '../VERSION'));
    res.send(version);
  } catch (ignored) {
    res.send('Missing VERSION file');
  }
});

app.get('*', (req, res) => {
  if (req.url.indexOf('client.js') >= 0) {
    res.sendFile(pathClientBundle);
  } else {
    //so that any routing is delegated to the client
    res.render(path.join(pathContent + '/index.jade'), req.user);
  }
});

//start the server by default
app.listen(port, hostname, (err) => {
  if (err) {
    console.log('error listening!', err.stack);
    return;
  }

  /* eslint-disable no-console */
  console.log(`Building, will serve at http://${hostname}:${port}/`);
});

export default app;
