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
import * as rollup from '../data/rollup';
import * as querying from '../data/querying';
import makeEgfRollup from '../../data/egf_parts/project';
import rollupWithConstruct from '../../src/utils/rollup/rollupWithConstruct';

/*
This file creates starting content for users

NOTE - create instances using Block.classless and Project.classless - the server is expect JSON blobs that it can assign to, and instances of classes are frozen.
 */

//create the EGF project + empty project for them
const createInitialData = (user) => {
  const egfRollup = makeEgfRollup();
  console.log('[EGF ROLLUP] made rollup ' + egfRollup.project.id + ' for user ' + user.uuid);
  //console.log(egfRollup);

  const emptyProjectRollup = rollupWithConstruct(true);

  return rollup.writeProjectRollup(egfRollup.project.id, egfRollup, user.uuid)
    .then(() => rollup.writeProjectRollup(emptyProjectRollup.project.id, emptyProjectRollup, user.uuid));
};

const checkUserSetup = (user) => {
  return querying.listProjectsWithAccess(user.uuid)
    .then(projects => {
      if (!projects.length) {
        // create rollups return ID of empty project
        return createInitialData(user)
          .then(rollup => rollup.project.id);
      }
    });
};

export default checkUserSetup;
