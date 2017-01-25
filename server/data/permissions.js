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
/**
 * Utilities for creating permission files for a project, and validating permissions. Also exports a routing middleware function for checking permissions.
 *
 * Permissions for projects are checked in `index.js` router... Other utilities assume that permissions are valid when they are called.
 *
 * @module permissions
 */
import debug from 'debug';
import invariant from 'invariant';

import { errorInvalidId, errorDoesNotExist, errorNoIdProvided } from '../utils/errors';
import * as projectPersistence from './persistence/projects';
import { id as idRegex } from '../../src/utils/regex';

const logger = debug('constructor:permissions');

export const projectIdParamAssignment = (req, res, next, id) => {
  const { user } = req;
  const projectId = id;

  logger(`[projectIdParamAssignment] Checking ${projectId} for ${user ? user.uuid : 'null'}`);

  if (projectId && !idRegex().test(projectId)) {
    logger(`[projectIdParamAssignment] projectId ${projectId} invalid @ ${req.url}`);
    res.status(400).send(errorInvalidId);
    return;
  }

  Object.assign(req, { projectId });

  projectPersistence.getProjectOwner(projectId)
  .then((owner) => {
    logger(`[projectIdParamAssignment] projectId ${projectId} owner: ${owner}`);
    Object.assign(req, { projectOwner: owner });
    next();
  })
  .catch(err => {
    if (err === errorDoesNotExist) {
      logger(`[projectIdParamAssignment] projectId ${projectId} does not exist`);
      Object.assign(req, { projectDoesNotExist: true, projectOwner: null });
      return next();
    }

    logger('[projectIdParamAssignment] uncaught error checking access');
    res.status(500).send('error checking project access');
  });
};

export const ensureReqUserMiddleware = (req, res, next) => {
  if (!req.user || !req.user.uuid) {
    res.status(401);
    logger('no user attached by auth middleware @', req.url);
    next('[ensureReqUserMiddleware] user not attached to request by middleware');
    return false;
  }

  return true;
};

//assumes req.projectId, req.user, req.projectOwner (see projectIdParamAssignment)
export const userOwnsProjectMiddleware = (req, res, next) => {
  const { user, projectId, projectOwner } = req;

  logger(`[userOwnsProjectMiddleware] Checking ${projectId} for ${user ? user.uuid : 'null'} (owner: ${projectOwner})`);

  if (!projectId) {
    return res.status(400).send(errorNoIdProvided);
  }

  if (!ensureReqUserMiddleware(req, res, next)) {
    return;
  }

  invariant(projectOwner, '[userOwnsProjectMiddleware] if req.projectId and req.user, req.projectOwner must be defined');

  if (projectOwner !== user.uuid) {
    logger(`[userOwnsProjectMiddleware] user ${user.uuid} cannot access ${projectId} (owner: ${projectOwner})`);
    return res.status(403).send(`User does not have access to project ${projectId}`);
  }

  next();
};
