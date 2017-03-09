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
import request from 'supertest';

import { testUserId } from '../../constants';
import { createExampleRollup } from '../../_utils/rollup';
import * as projectPersistence from '../../../server/data/persistence/projects';
import devServer from '../../../server/server';

describe('Server', () => {
  describe('Jobs', () => {
    describe('REST', () => {
      let server;

      beforeEach('server setup', () => {
        server = devServer.listen();
      });
      afterEach(() => {
        server.close();
      });

      describe('files', () => {
        const roll = createExampleRollup();
        const projectId = roll.project.id;
        const namespace = 'yay';
        const fileName = 'woohoo';
        const fileContents = 'wowsers';

        before(() => projectPersistence.projectWrite(projectId, roll, testUserId));

        const url = `/jobs/file/${projectId}/${namespace}/${fileName}`;

        it('POST a file', (done) => {
          request(server)
          .post(url)
          .send(fileContents)
          .expect(200, done);
        });

        it('can get file', (done) => {
          request(server)
          .get(url)
          .expect(200)
          .end((err, result) => {
            if (err) {
              done(err);
              return;
            }

            expect(result).to.equal(fileContents);
          });
        });
      });

      it('can start job', () => { throw new Error('todo'); });
      it('can get job', () => { throw new Error('todo'); });
    });
  });
});
