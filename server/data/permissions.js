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
import { errorInvalidId, errorNoIdProvided, errorNoPermission, errorDoesNotExist } from '../utils/errors';
import { id as idRegex } from '../../src/utils/regex';
import { getUserProjectIds, projectGet } from './persistence/projects';

//todo - use new api to check this
//check access to a particular project
export const checkProjectAccess = (projectId, userId, projectMustExist = false) => {
  return getUserProjectIds(userId)
    .then((projectIds) => {
      if (projectIds.indexOf(projectId) >= 0) {
        return true;
      }

      return projectGet(projectId)
        .then(project => Promise.reject(errorNoPermission))
        .catch(err => {
          if (err === errorDoesNotExist && !projectMustExist) {
            return true;
          }

          console.log('unexpected error checking project access');
          console.error(err);
          return Promise.reject(errorDoesNotExist);
        });
    })
    .catch(err => {
      console.error(err);
      throw err;
    });
};

export const projectPermissionMiddleware = (req, res, next) => {
  const { projectId, user } = req;

  //should be caught by preceding middleware but just in case...
  if (!user) {
    console.error('no user attached by auth middleware @', req.url);
    next('[projectPermissionMiddleware] user not attached to request by middleware');
    return;
  }

  //should be caught by preceding middleware but just in case...
  if (!user.uuid) {
    res.status(401);
    next('[projectPermissionMiddleware] no user.uuid present on request object');
    return;
  }

  if (!projectId) {
    res.status(400).send(errorNoIdProvided);
    next('[projectPermissionMiddleware] projectId not found on route request');
    return;
  }
  if (!idRegex().test(projectId)) {
    //todo - status text is not being sent to the client. probably need to pass to error handler, which uses error as status text (this is going as body)
    res.status(400).send(errorInvalidId);
    next('[projectPermissionMiddleware] projectId is not valid, got ' + projectId);
    return;
  }

  checkProjectAccess(projectId, user.uuid)
    .then(() => next())
    .catch((err) => {
      if (err === errorNoPermission) {
        return res.status(403).send(`User ${user.email} does not have access to project ${projectId}`);
      }
      console.log('permissions error:', err);
      console.log(err.stack);
      res.status(500).send('error checking project access');
    });
};
