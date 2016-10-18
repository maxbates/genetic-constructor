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
import uuid from 'node-uuid';
import md5 from 'md5';
import rejectingFetch from '../../../../src/middleware/utils/rejectingFetch';

import { errorDoesNotExist } from '../../../../server/utils/errors';
import * as persistence from '../../../../server/data/persistence';
import * as s3 from '../../../../server/data/persistence/s3';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('S3', function persistenceTestsS3() {
        //skip test suite if not using s3
        before(function runCheck() {
          if (!s3.useRemote) {
            this.skip();
          }
        });

        const seq = 'actagctagctacatctagctgctagcatcgtgctgactgacggctatcgatcgactgatcgatcgatcgatc';
        const hash = md5(seq);

        // SEQUENCE
        it('sequenceRead() should fail on sequences that dont exist', () => {
          return persistence.sequenceGet(uuid.v4())
            .then(huhwhat => Promise.reject('nah uh. shuoldnt have worked'))
            .catch((err) => {
              expect(err).to.equal(errorDoesNotExist);
            });
        });

        it('sequenceWrite() should read a sequence from S3', () => {
          return persistence.sequenceWrite(hash, seq)
            .then(() => {
              const url = persistence.sequenceGetUrl(hash);
              return rejectingFetch(url)
                .then(resp => resp.text());
            })
            .then(result => {
              expect(result).to.be.defined;
              expect(result).to.equal(seq);
            });
        });

        it('sequenceRead() should write a sequence to S3', () => {
          return persistence.sequenceGet(hash)
            .then(result => {
              expect(result).to.equal(seq);
            });
        });

        it('sequenceRead() can get a byte range', () => {
          const start = 10;
          const end = 30;
          return persistence.sequenceGet(`${hash}[${start}:${end}]`)
            .then(result => {
              expect(result).to.equal(seq.substring(start, end));
            });
        });
      });
    });
  });
});
