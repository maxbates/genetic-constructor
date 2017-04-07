/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import colors from 'colors/safe';

import pkg from '../package.json';
import { API_END_POINT, HOST_NAME, HOST_PORT } from './urlConstants';
import logger from './utils/logConfig';

import dataRouter from './data/router';
import jobRouter from './jobs/router';
import extensionsRouter from './extensions/router';
import orderRouter from './order/router';
import reportRouter from './report/router';
import commonsRouter from '../commons/router';
import s3MockRouter from './files/s3mockRouter';
import { s3MockPath } from './data/middleware/filePaths';
import { registrationHandler } from './user/updateUserHandler';
import userRouter from './user/userRouter';
import checkUserSetup from './onboarding/userSetup';
import { pruneUserObject } from './user/utils';
import checkPortFree from './utils/checkPortFree';
import customErrorMiddleware from './errors/customErrorMiddleware';
import lastDitchErrorMiddleware from './errors/lastDitchErrorMiddleware';

/* eslint global-require: 0 */

//where the server will be listening
const hostPath = `http://${HOST_NAME}:${HOST_PORT}/`;

// file paths depending on if building or not
// use `npm run start` in order to serve the client bundle + webpack middleware
// use `npm run start-instance` to build and serve client bundles
// NB - server is not currently built when run, so process.env.BUILD is not set
const createBuildPath = (isBuild, notBuild = isBuild) => path.join((process.env.BUILD ? '../build' : __dirname), (process.env.BUILD ? isBuild : notBuild));
const pathContent = createBuildPath('content', '../src/content');
const pathDocs = createBuildPath('jsdoc', `../docs/jsdoc/genetic-constructor/${pkg.version}`);
const pathImages = createBuildPath('images', '../src/images');
const pathPublic = createBuildPath('public', '../src/public');
const pathPublicStatic = createBuildPath('static', '../build/static');

//create server app
const app = express();

//enable deflate / gzip
app.use(compression());

//use large body limit at root so that 100kb default doesnt propagate / block downstream
app.use(bodyParser.json({
  limit: '50mb',
  strict: false,
}));

//HTTP logging middleware
app.use(logger);

// view engine setup
app.set('views', pathContent);
app.set('view engine', 'pug');

// Register API middleware
// ----------------------------------------------------

// STORAGE

// routes / mini-app for interacting with postgres DB
// expose this route for local development, production will call `process.env.STORAGE_API` directly
// in deployed environment this API will be available on a different host, and not at this route endpoint
//note - should come before local auth setup, so that mockUser setup can call storage without middleware in place
if (!process.env.STORAGE_API) {
  console.log('[DB] Storage API mounted locally at /api/');
  app.use(require('gctor-storage').mockReqLog); // the storage routes expect req.log to be defined
  app.use('/api', require('gctor-storage').routes);
}

// AUTH

// insert some form of user authentication
// the auth routes are currently called from the client and expect JSON responses
if (process.env.BIO_NANO_AUTH) {
  console.log('[Auth] Real user authentication enabled');
  const initAuthMiddleware = require('bio-user-platform').initAuthMiddleware; //eslint-disable-line

  const authConfig = {
    logoutLanding: false,
    loginLanding: false,
    loginFailure: false,
    resetForm: '/homepage/reset',
    apiEndPoint: API_END_POINT,
    onLogin: (req, res, next) => checkUserSetup(req.user)
    .then(projectId =>
      //note this expects an abnormal return of req and res to the next function
      next(req, res))
    .catch((err) => {
      console.log(err);
      console.log(err.stack);
      res.status(500).end();
    }),
    //onLogin: (req, res, next) => next(req, res), //mock
    registerRedirect: false,
    emailDirectory: 'emails',
    verifyLanding: '/homepage',
    loginPath: '/homepage/signin',
    addNewRegToSendGrid: true,
    contactList: 1049400,
    defaultSendGridList: 1049400,
  };
  app.use(initAuthMiddleware(authConfig));
} else {
  console.log('[Auth] Local mocked authentication enabled');
  app.use(require('cookie-parser')());

  const localAuth = require('./auth/local');

  //force default user on all requests
  //NOTE - requires / enforces that users are always signed in to hit API, even for non-client originating requests. what about extensions?
  app.use(localAuth.mockUser);

  //mount the mock authentication routes
  app.use('/auth', localAuth.router);

  //do an initial setup of the user's projects on server start
  //do not run on every call, so if get into a bad state, restart server
  localAuth.prepareUserSetup();
}

//expose our own register route to handle custom onboarding
app.post('/register', registrationHandler);
app.use('/user', userRouter);

// PRIMARY ROUTES

app.use('/data', dataRouter);
app.use('/jobs', jobRouter);
app.use('/order', orderRouter);
app.use('/extensions', extensionsRouter);
app.use('/report', reportRouter);
app.use('/commons', commonsRouter);

if (process.env.NODE_ENV !== 'production') {
  //mock s3 routes for jobs/extensions etc. so read/write don't fail
  app.use(`/${s3MockPath}`, s3MockRouter);
}

// STATIC ROUTES

app.use('/images', express.static(pathImages));
app.use('/help/docs', express.static(pathDocs));
app.use('/static', express.static(pathPublicStatic)); //browsersync proxy gets priority
app.use(express.static(pathPublic));

app.get('/version', (req, res) => {
  try {
    //this is only relevant when the server builds, so can assume always at same path relative to __dirname
    const version = fs.readFileSync(path.join(__dirname, '../VERSION'));
    res.send(version);
  } catch (ignored) {
    res.send('Missing VERSION file');
  }
});

// PAGE LOADING

app.get('*', (req, res) => {
  //on root request (ignoring query params), if not logged in, show them the landing page
  if ((req.path === '' || req.path === '/') && !req.user) {
    res.sendFile(`${pathPublic}/landing.html`);
    return;
  }

  //otherwise, send the index page
  //so that any routing is delegated to the client

  // setup user properties and discourse base url to flash to client
  const prunedUser = pruneUserObject(req.user);
  const config = prunedUser.config ? JSON.stringify(prunedUser.config) : '{}';
  const user = Object.assign({}, prunedUser, { config });

  const params = Object.assign({
    discourseDomain: process.env.BNR_ENV_URL_SUFFIX || 'https://forum.bionano.autodesk.com',
    productionEnvironment: process.env.NODE_ENV === 'production',
  }, user);

  res.render(path.join(`${pathContent}/index.pug`), params);
});

//handle our custom errors with appropriate codes
app.use(customErrorMiddleware);

//basically, just return a 500 if we hit this
app.use(lastDitchErrorMiddleware);

/*** running ***/
/* eslint-disable no-console */

function handleError(err) {
  console.log(colors.bgRed('Error starting server. Terminating...'));
  console.log(colors.red(err));
  console.log(err.stack);
  //42 is totally arbitrary, but listen for it in runServer.js
  process.exit(42);
}

function startServer() {
  return new Promise((resolve, reject) => {
    app.listen(HOST_PORT, HOST_NAME, (err) => {
      if (err) {
        handleError(err);
      }

      console.log(colors.bgGreen(`Server listening at ${hostPath}`));
      resolve(hostPath);
    });
  });
}

// initialize the DB connection if we're not using an external storage API
// note - requires running `npm run storage-db`
function initDb() {
  return new Promise((resolve, reject) => {
    const init = (!process.env.STORAGE_API) ?
      require('gctor-storage').init :
      cb => cb();

    init(resolve);
  });
}

//check if the port is taken, and init the db, and star the server
//returns a promise, so you can listen and wait until it resolves
export const listenSafely = () =>
  //first check if the port is in use -- e.g. tests are running, or some other reason
  checkPortFree(HOST_PORT, HOST_NAME)
  .then(initDb)
  .then(startServer)
  .catch(handleError);

//attempt start the server by default
if (process.env.SERVER_MANUAL !== 'true') {
  listenSafely();
} else {
  console.log('Server ready, will start listening manually...');
}

//explicit listener for termination event for webpack etc, to kill process and not hog the port
process.on('SIGTERM', () => {
  process.exit(0);
});

export default app;
