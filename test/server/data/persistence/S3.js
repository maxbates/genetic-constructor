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
import * as s3 from '../../../../server/data/persistence/s3';
import AWS from 'aws-sdk';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('S3', function S3Persistence() {
        //skip test suite if not using s3
        before(function () {
          if (!s3.useRemote) {
            this.skip();
          }
        });

        const bucketName = 'bionano-gctor-files';
        const bucket = s3.getBucket(bucketName);

        const stringName = uuid.v4();
        const stringContents = 'something';

        const objectName = uuid.v4();
        const objectContents = { hey: 'there' };

        it('getBucket() returns AWS bucket', () => {
          expect(bucket).to.be.defined;
          expect(typeof bucket.getObject).to.equal('function');
          expect(typeof bucket.getSignedUrl).to.equal('function');
        });

        //todo
        it('getBucket() provisions bucket if doesnt exist');

        it('getSignedUrl() returns url', () => {
          const url = s3.getSignedUrl(bucket, 'myFile');
          expect(url).to.be.defined;
          assert(/https/.test(url), 'expected https');
        });

        it('getSignedUrl() can get url for putting object', () => {
          const url = s3.getSignedUrl(bucket, 'myFile', 'putObject');
          expect(url).to.be.defined;
          assert(/https/.test(url), 'expected https');
        });

        it('stringPut() puts string, returns a version', () => {
          return s3.stringPut(bucket, stringName, stringContents)
            .then(result => {
              assert(result.VersionId, 'expected VersionId');
            });
        });

        it('stringGet() gets string', () => {
          return s3.stringPut(bucket, stringName)
            .then(result => {
              expect(result).to.equal(stringContents)
            });
        });

        it('objectGet() gets object, parses');

        it('objectPut() puts object');

        it('itemExists() checks if exists');

        it('itemDelete() deletes object');

        //todo
        it('itemVersions() gets versions of an object');

        //todo
        it('itemPutBuffer() uploads a buffer');
        it('itemGetBuffer() downloads a buffer');
      });
    });
  });
});
