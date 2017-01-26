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

import debug from 'debug';
import invariant from 'invariant';
import _ from 'lodash';

import * as projectPersistence from './projects';
import * as projectVersions from './projectVersions';
import * as snapshots from './snapshots';
import { errorDoesNotExist } from '../../utils/errors';

const logger = debug('constructor:data:persistence:commons');

export const COMMONS_TAG = 'COMMONS_TAG';

//NB - mutates the json directly
export const lockProjectDeep = (roll) => {
  //freeze project
  roll.project.rules.frozen = true;

  //freeze blocks
  _.forEach(roll.blocks, (block) => { block.rules.frozen = true; });
  return roll;
};

export const checkProjectPublic = (projectId, version) => {
  //todo
};

export const commonsQuery = (query = {}) => {
  //todo - query snapshots with public tag
};

export const commonsRetrieveVersions = (projectId) => {
  //todo
};

export const commonsRetrieve = (projectId, version) => {
  if (version) {
    return projectVersions.projectVersionGet(projectId, version)
    .then(lockProjectDeep);
  }

  //otherwise, get latest

  //todo - handle no permissions, version doesnt exist, project doesnt exist

  //todo - get latest published
};

// Publish a project (create a public snapshot)
// version -> assert exists and mark public, body = snapshot info
// !version -> create public snapshot, body = rollup
export const commonsPublish = (projectId, userId, version, body) => {
  //todo

  const publicTag = snapshots.SNAPSHOT_TAG_PUBLIC;
};

// Unpublish a project (mark snapshot as non-public, do not delete)
// version -> should just mark as non-public, not remove the snapshot
// !version -> remove public from all snapshots
export const commonsUnpublish = (projectId, userId, version) => {
  //todo
};

//custom permissions middleware
//given a project and a verison, check if its public
export const checkProjectPublicMiddleware = (req, res, next) => {
  const { projectId, version } = req;

  invariant(projectId, '[checkProjectPublicMiddleware] project ID required on request');

  checkProjectPublic(projectId, version)
  .then(() => next())
  .catch(err => res.status(403).send(err));
};
