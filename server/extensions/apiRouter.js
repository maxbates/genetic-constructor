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
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { errorExtensionNotFound } from '../utils/errors';
import extensionRegistry, { getServerExtensions } from './registry';

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json();
router.use(jsonParser);

/** Route Checking **/

//for URLs properly formed with an extension already registered, delegate to the router
router.all('/:ext/*', (req, res, next) => {
  const { ext, route } = req.params;

  const extension = extensionRegistry[ext];

  if (!extension) {
    console.log(`could not find extension ${ext} in registry (${Object.keys(extensionRegistry).join(', ')})`);
    return res.status(404).send(errorExtensionNotFound);
  }

  //let the route continue
  //todo - reassign user object? remove cookies? prune request
  next();
});

/** Route Registering **/

const serverExtensions = getServerExtensions();
Object.keys(serverExtensions).forEach(key => {
  const manifest = serverExtensions[key];
  const routePath = manifest.geneticConstructor.router;

  //todo - build dependent path lookup
  const extensionRouter = require(path.resolve(__dirname, 'node_modules', key, routePath));

  //todo - error handling
  //todo - wrap router in a try-catch? Put in own process?
  router.use(`/${key}/`, extensionRouter);
});

//catch-all
router.all('*', (req, res, next) => {
  res.status(404).send();
});

export default router;
