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

import { projectIdParamAssignment, ensureReqUserMiddleware, userOwnsProjectMiddleware } from './permissions';
import * as commons from './persistence/commons';

const router = express.Router(); //eslint-disable-line new-cap

// check user and project Id valid
router.param('projectId', projectIdParamAssignment);
router.use(ensureReqUserMiddleware);

// routes

router.route('/query')
.post((req, res, next) => {
  const query = req.body;
  return commons.commonsQuery(query)
  .then(results => res.json(results))
  .catch(next);
});

router.route('/:projectId/:version?')
// get the published project, @ version, or latest
.get(
  commons.checkProjectPublicMiddleware,
  (req, res, next) => {
    const { projectId, version } = req;

    //request all versions
    if (version === 'versions') {
      return commons.commonsRetrieveVersions(projectId)
      .then(results => res.json(results))
      .catch(next);
    }

    return commons.commonsRetrieve(projectId, version)
    .then(project => res.status(200).json(project))
    .catch(next);
  })

// publish, given projectId and version
.post(
  userOwnsProjectMiddleware,
  (req, res, next) => {
    const { user, projectId, version } = req;

    commons.commonsPublish(projectId, user.uuid, version, req.body)
    .then(info => res.json(info))
    .catch(next);
  })

//publish, given rollup, at new version
.put(
  userOwnsProjectMiddleware,
  (req, res, next) => {
    const { user, projectId } = req;
    const roll = req.body;

    res.status(501).send('todo');
    //todo - write, snapshot, and publish
  })

// unpublish
.delete(
  userOwnsProjectMiddleware,
  (req, res, next) => {
    const { user, projectId, version } = req;
    commons.commonsUnpublish(projectId, user.uuid, version)
    .then(info => res.json(info))
    .catch(next);
  });

//catch-all
router.route('*').all((req, res) => res.status(501).send());

export default router;
