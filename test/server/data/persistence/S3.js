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

        it('getBucket() returns bucket');
        it('getBucket() provisions bucket if doesnt exist');
        it('getSignedUrl() returns url');
        it('objectExists() checks if exists');
        it('stringGet() gets string');
        it('stringPut() puts string');
        it('objectGet() gets object, parses');
        it('objectPut() puts object');
        it('objectDelete() deletes object');
      });
    });
  });
});
