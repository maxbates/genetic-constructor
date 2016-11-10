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

import * as projectPersistence from '../data/persistence/projects';
import onboardNewUser from './onboardNewUser';
import DebugTimer from '../utils/DebugTimer';

//if user has been setup, then return true
const checkUserSetup = (user) => {
  /*
   if (user && user.data && user.data.constructor === true) {
   return Promise.resolve(true);
   }
   */

  const timer = new DebugTimer('checkUserSetup ' + user.uuid, { disabled: true });

  return projectPersistence.getUserLastProjectId(user.uuid)
    .then(projectId => {
      timer.end('query complete, already onboarded');
      return projectId;
    })
    .catch(err => {
      timer.time('query complete, onboarding');
      return onboardNewUser(user)
        .then(rolls => {
          console.log(`[User Setup] Generated ${rolls.length} projects for user ${user.uuid} (${user.email}):
${rolls.map(roll => `${roll.project.metadata.name || 'Unnamed'} @ ${roll.project.id}`).join('\n')}`);

          timer.end('onboarded');
          return rolls[0].project.id;
        })
        .catch(err => {
          console.log('error onboarding user', user);
          return Promise.reject(err);
        });
    });
};

export default checkUserSetup;
