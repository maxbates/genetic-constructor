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
  describe('Onboarding', () => {
    const makeUser = (nameStub) => ({
      uuid: uuid.v1(),
      email: `test${nameStub}@tester.com`,
      firstName: 'Dev',
      lastName: 'Eloper',
    });

    const numUsers = 50;
    const users = range(numUsers)
      .map((num) => makeUser(num));

    it('should onboard a user and create at least a project for them', () => {
      const user = makeUser();
      return onboardNewUser(user)
        .then(rolls => {
          assert(rolls.length > 0 && !!rolls[0].project.id, 'should have some projects');
        });
    });

    it('can take a config of starting projects');

    it('should onboard many users quickly', () => {
      const start = process.hrtime();
      return Promise.all(
        users.map((user) => onboardNewUser(user))
      )
        .then(projectIds => {
          const end = process.hrtime();
          const time = (end[0] - start[0]) + ((end[1] - start[1]) / Math.pow(10, 9));
          assert(time < 10000, 'should take less than 10 seconds to onboard users');
        });
    });
  });
});