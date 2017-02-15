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

import _ from 'lodash';

import batchPromises from '../batchPromises';
import { listAllProjects } from '../../../server/data/persistence/admin';

import { projectVersionByUUIDRaw, projectVersionWrite } from '../../../server/data/persistence/projectVersions';

import Rollup from '../../../src/models/Rollup';

// expects raw entry from database
// updates project and returns it
const migrateProject = (project, { uuid, id, version, owner }) => {
  if (!project) {
    console.log('Project is empty, skipping', uuid, id, version);
    return null;
  }

  //only update projects with old schema
  if (Number.isInteger(project.schema) && project.schema >= 2) {
    return null;
  }

  // (1) add project.owner, remove project.metadata.authors
  _.assign(project.project, { owner });
  _.unset(project.project, 'metadata.authors');

  // (2) assign keywords to project and blocks
  _.defaults(project.project.metadata, { keywords: [] });
  _.forEach(project.blocks, block => _.defaults(block.metadata, { keywords: [] }));

  // (3) add owner + version to block parents
  _.forEach(project.blocks, (block) => {
    const newParents = [];

    _.forEach(block.parents, (parent) => {
      //remove parent if something about it is unknown
      if (!parent.projectId || !parent.id || !Number.isInteger(parent.version)) {
        return;
      }

      //can assume the user owned the project it cloned from, since this is pre-sharing
      //annoying case of EGF project, since user owns at this point, but in future will be published (on the first clone at least)
      newParents.push({
        owner,
        ...parent,
      });
    });

    block.parents = newParents;
  });

  //update schema version
  project.schema = 2;

  //validate just to be sure
  Rollup.validate(project, true);

  return project;
};

//returns promise
const getAndUpdateAndWriteProject = (projectInfo) => {
  const { uuid, id, version, owner } = projectInfo;

  console.log(`updating ${uuid}`);

  return projectVersionByUUIDRaw(uuid)
  .then((rawProject) => {
    const updated = migrateProject(rawProject.data, projectInfo);
    if (!updated) {
      console.log(`[skip] ${uuid}`);
      return Promise.resolve();
    }
    return projectVersionWrite(id, version, owner, updated);
  })
  .catch((err) => {
    console.error('error migrating project');
    console.error(projectInfo);
    console.error(err);
    return null;
  });
};

(async () => {
  try {
    // SETUP

    //array of { uuid, id, owner, version, status }
    const allProjects = await listAllProjects();
    const uniqueProjects = _.uniqBy(allProjects, 'id');

    /*
     //array of ids
     const projectIds = _.map(uniqueProjects, 'id');

     // dictionary { projectId : owner }
     const projectOwnerMap = _.zipObject(
     projectIds,
     _.map(uniqueProjects, 'owner'),
     );
     */

    console.log(`got ${allProjects.length} project-versions (${uniqueProjects.length} unique projects)`);
    //console.log(allProjects);

    // CYCLE - get project, update, write, repeat

    await batchPromises(allProjects.map(projectInfo => () => getAndUpdateAndWriteProject(projectInfo)), 3);

    console.log('migration complete');
  } catch (err) {
    console.error(err);
  }
})();
