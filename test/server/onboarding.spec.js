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

import { assert, expect } from 'chai';
import { range, merge } from 'lodash';
import uuid from 'node-uuid';
import onboardNewUser from '../../server/onboarding/onboardNewUser';

describe('Server', () => {
  describe.only('Onboarding', function onboardingSuite() {
    //this.timeout(5000);

    const numUsers = 5;
    const users = range(numUsers)
      .map(() => uuid.v4())
      .map((userId, index) => ({
        uuid: userId,
        email: `test${index}@tester.com`,
        firstName: 'Dev',
        lastName: 'Eloper',
      }));

    //todo
    it('should onboard a user and create at least a project for them');

    //todo
    it('should onboard many users quickly', () => {
      const start = process.hrtime();
      return Promise.all(
        users.map((user) => onboardNewUser(user))
      )
        .then(projectIds => {
          console.log(projectIds);
          const end = process.hrtime();
          const time = (end[0] - start[0]) + ((end[1] - start[1]) / Math.pow(10, 9));

          console.log('took ', time);

          assert(time < 10000, 'should take less than 10 seconds to onboard users')
        });
    });
  });
});