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
import _ from 'lodash';

import { errorDoesNotExist, errorInvalidModel, errorVersioningSystem } from './../utils/errors';
import * as projectPersistence from './persistence/projects';
import * as snapshots from './persistence/snapshots';

const router = express.Router(); //eslint-disable-line new-cap

//NB - this route is for a particular project, permissions have already been checked for project... querying across projects would need to be separate to avoid permissions issues

router.route('/:version?')
  .get((req, res, next) => {
    //pass the version you want, otherwise send commit log
    const { projectId, projectDoesNotExist } = req;
    const { version } = req.params;
    const { tags } = req.query;

    if (projectDoesNotExist === true) {
      return res.status(404).send(errorDoesNotExist);
    }

    if (version) {
      snapshots.snapshotGet(projectId, version)
        .then(snapshot => res.status(200).json(snapshot))
        .catch(err => next(err));
    } else {
      snapshots.snapshotQuery(tags, projectId)
        .then(log => {
          //no need to filter, since have already ensure the user owns the project
          res.status(200).json(log);
        })
        .catch((err) => {
          //return 200 if project exists (implicit, due to prior middleware) but no snapshots found
          if (err === errorDoesNotExist) {
            return res.status(200).json([]);
          }
          next(err);
        });
    }
  })
  .post((req, res, next) => {
    //you can POST a field 'message' for the commit, and an object of 'tags'
    //can also post a field 'rollup' for save a new rollup for the commit
    //receive the version
    const { user, projectId, projectDoesNotExist } = req;
    const { version } = req.params;
    const { message, rollup: roll, tags } = req.body;

    if (projectDoesNotExist && !roll) {
      return res.status(404).send(errorDoesNotExist);
    }

    if (version && roll) {
      return res.status(422).send('cannot send version and roll');
    }

    //will validate when attempt to write, so this check is enough
    const rollupDefined = roll && roll.project && roll.blocks;

    //use version they gave or get latest
    const getVersionPromise = version ?
      Promise.resolve(version) :
      projectPersistence.projectExists(projectId).then(version => version);

    //write rollup if passed (will validate it), or just pass version to snapshot writing
    const writePromise = rollupDefined ?
      projectPersistence.projectWrite(projectId, roll, user.uuid)
        .then(({ version }) => version) :
      getVersionPromise;

    writePromise
      .then(version => snapshots.snapshotWrite(projectId, user.uuid, version, message, tags))
      .then(snapshot => res.status(200).json(snapshot))
      //may want better error handling here
      .catch((err) => {
        if (err === errorInvalidModel) {
          return res.status(422).send(err);
        }
        if (err === errorVersioningSystem) {
          return res.status(500).send(err);
        }
        return next(err);
      });
  });

export default router;
