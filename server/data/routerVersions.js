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
import {
  errorVersioningSystem,
  errorInvalidRoute,
  errorInvalidModel,
  errorDoesNotExist,
  errorFileNotFound,
} from './../utils/errors';
import * as projectPersistence from './persistence/projects';
import * as projectVersions from './persistence/projectVersions';

const router = express.Router(); //eslint-disable-line new-cap

router.route('/:version?')
  .get((req, res, next) => {
    //pass the version you want, otherwise send commit log
    const { projectId } = req;
    const { version } = req.params;

    if (version) {
      projectVersions.projectVersionGet(projectId, version)
        .then(project => res.status(200).json(project))
        .catch(err => next(err));
    } else {
      //todo - update log format + tests + client middleware expectations
      projectVersions.projectVersionList(projectId)
        .then(log => res.status(200).json(log))
        .catch(err => next(err));
    }
  })
  .post((req, res, next) => {
    //you can POST a field 'message' for the commit, and an object of 'tags'
    //can also post a field 'rollup' for save a new rollup for the commit
    //receive the version
    const { user, projectId } = req;
    const { message, rollup: roll, tags } = req.body;

    const rollupDefined = roll && roll.project && roll.blocks;

    const writePromise = rollupDefined ?
      projectPersistence.projectWrite(projectId, roll, user.uuid) :
      Promise.resolve();

    //todo - use constants for 'USER'

    writePromise
      .then(() => projectVersions.projectVersionSnapshot(projectId, user.uuid, 'USER', message, tags))
      .then(commit => res.status(200).json(commit))
      //may want better error handling here
      .catch(err => {
        if (err === errorInvalidModel) {
          return res.status(422).send(err);
        }
        if (err === errorVersioningSystem) {
          return res.status(500).send(err);
        }
        return next(err);
      });
  });
