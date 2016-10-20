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
import Project from '../../../../../src/models/Project';
import { errorDoesNotExist } from '../../../../../server/utils/errors';
import * as projectFiles from '../../../../../server/data/persistence/projectFiles';
import * as s3 from '../../../../../server/data/persistence/s3';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('Project Files', () => {
        describe('S3', function projectFilesS3Tests() {
          //skip test suite if not using s3
          before(function () {
            if (!s3.useRemote) {
              this.skip();
            }
          });

          it('projectFilesWrite() should write a file');
          it('projectFilesRead() should read a file');
          it('listProjectFiles() should list files');
        });
      });
    });
  });
});