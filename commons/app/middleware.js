/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copVy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

//isomorphic middleware
//necessary things are required, so only loaded as needed per environment

/* eslint-disable global-require */

const commons = process.env.BROWSER ?
  require('../../src/middleware/commons') :
  require('../../server/data/persistence/commons');

//todo - routing by name, not UUID
export const findProjectByName = name =>
  Promise.resolve('todo');

//projectId optional, can be used to filter query to that project (i.e. only fetch single project)
export const getCommonsSnapshots = projectId =>
  commons.commonsQuery({}, true, projectId);

export const loadProjectVersion = (snapshot) => {
  if (proces.env.BROWSER) {
    return commons.retrieve(snapshot.projectId, snapshot.version);
  }

  const projectVersions = require('../../server/data/persistence/projectVersions');
  return projectVersions.projectVersionByUUID(snapshot.projectUUID);
};

//todo - optimize - single call with multiple UUIDs (server specific version)
//todo - no blocks on home page
export const loadProjects = snapshots =>
  Promise.all(snapshots.map(loadProjectVersion()));

/* eslint-enable global-require */
