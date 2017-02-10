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

import { errorDoesNotExist } from '../errors/errorConstants';
import { projectIdParamAssignment, userOwnsProjectMiddleware } from './permissions';
import * as projectPersistence from './persistence/projects';
import * as snapshots from './persistence/snapshots';

const router = express.Router(); //eslint-disable-line new-cap

router.param('projectId', projectIdParamAssignment);

router.param('version', (req, res, next, id) => {
  Object.assign(req, { version: parseInt(id, 10) });
  next();
});

router.route('/keywords')
.get((req, res, next) => {
  snapshots.snapshotGetKeywordMap()
  .then(map => res.status(200).send(map))
  .catch(next);
})
.post((req, res, next) => {
  const { user } = req;
  const filters = req.body;

  snapshots.snapshotGetKeywordMap(filters, user.uuid)
  .then(map => res.status(200).send(map))
  .catch(next);
});

router.route('/:projectId/:version?')
.all(userOwnsProjectMiddleware)
.get((req, res, next) => {
  //pass the version you want, otherwise send commit log
  const { projectId, projectDoesNotExist, version } = req;

  if (projectDoesNotExist === true) {
    return res.status(404).send(errorDoesNotExist);
  }

  if (Number.isInteger(version)) {
    snapshots.snapshotGet(projectId, version)
      .then(snapshot => res.status(200).json(snapshot))
      .catch(err => next(err));
  } else {
    snapshots.snapshotList(projectId)
      .then(log => res.status(200).json(log))
      .catch((err) => {
        //return 200 if project exists (implicit, due to prior middleware) but no snapshots found
        if (err === errorDoesNotExist) {
          return res.status(200).json([]);
        }
        next(err);
      });
  }
})

//todo - deprecate posting rollup
.post((req, res, next) => {
  //you can POST a field 'message' for the commit, and an object of 'tags', and array 'keywords'
  //can also post a field 'rollup' for save a new rollup for the commit
  //receive the version
  const { user, projectId, projectDoesNotExist, version } = req;
  const { message, rollup: roll, tags, keywords } = req.body;

  //will validate when attempt to write, so this check is enough
  const rollupDefined = roll && roll.project && roll.blocks;

  if (projectDoesNotExist && !rollupDefined) {
    return res.status(404).send(errorDoesNotExist);
  }

  if (Number.isInteger(version) && rollupDefined) {
    return res.status(422).send('cannot send version and roll');
  }

  //use version they gave or get latest
  const getVersionPromise = Number.isInteger(version) ?
    Promise.resolve(version) :
    projectPersistence.projectExists(projectId).then(version => version);

  //write rollup if passed (will validate it), or just pass version to snapshot writing
  const writePromise = rollupDefined ?
    projectPersistence.projectWrite(projectId, roll, user.uuid)
      .then(({ version }) => version) :
    getVersionPromise;

  const snapshotBody = { message, tags, keywords };

  writePromise
    .then(version => snapshots.snapshotWrite(projectId, user.uuid, version, snapshotBody))
    .then(snapshot => res.status(200).json(snapshot))
    //may want better error handling here
    .catch(next);
})

//update a snapshot, given project and version
.put((req, res, next) => {
  const { user, projectId, projectDoesNotExist, version } = req;
  const { message, tags, keywords } = req.body;

  if (projectDoesNotExist) {
    return res.status(404).send(errorDoesNotExist);
  }

  const snapshotUpdate = { message, tags, keywords };

  //this will handle if it does not exist and error accordingly
  snapshots.snapshotMerge(projectId, user.uuid, version, snapshotUpdate)
  .then(snapshot => res.status(200).json(snapshot))
  .catch(next);
});

export default router;
