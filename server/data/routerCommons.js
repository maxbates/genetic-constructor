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

import { ensureReqUserMiddleware } from '../user/utils';
import { errorDoesNotExist } from '../utils/errors';
import { projectIdValidMiddleware } from './permissions';
import * as commons from './persistence/commons';

const router = express.Router(); //eslint-disable-line new-cap

// params

router.param('projectId', (req, res, next, id) => {
  Object.assign(req, { projectId: id });
  next();
});

router.param('version', (req, res, next, id) => {
  Object.assign(req, { version: id });
  next();
});

// check user and project Id valid

router.use(ensureReqUserMiddleware);
router.use(projectIdValidMiddleware);

// commons permissions

//custom permissions middleware
//given a project and a verison, check if its public
router.use((req, res, next) => {
  const { projectId, version } = req;

  commons.checkProjectPublic(projectId, version)
  .then()
  .catch(err => res.status(403).send(err));
});

// routes

router.route('/:projectId/:version?')
//get the published project
.get((req, res, next) => {
  const { projectId, version } = req;

  //request all versions
  if (version === 'versions') {

  }

  //get a specific version
  if (version) {

  }

  //otherwise, get the project @ latest
})
//publish
.post((req, res, next) => {
  //todo
  // version -> assert exists and mark public
  // !version -> create public snapshot
})
//unpublish
.delete((req, res, next) => {
  //todo
  // version -> should just mark as non-public, not remove the snapshot
  // !version -> remove public from all snapshots
});

//catch-all
router.route('*').all((req, res) => res.status(501).send());

export default router;
