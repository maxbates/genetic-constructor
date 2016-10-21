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

import chai from 'chai';
import Project from '../../src/models/Project';
import * as api from '../../src/middleware/projectFile';
import * as s3 from '../../server/data/persistence/s3';

const { assert, expect } = chai;

//tests for project files across S3 and local file system - these should return consistently

describe('Middleware', () => {
  describe('Project Files', () => {
    const projectId = Project.classless().id;
    const namespace = 'someNamespace';
    const fileName = 'myFile';
    const fileContents = 'some initial contents';

    it('projectFileWrite() requires projectId, namespace, filename, and contents string', () => {
      expect(() => api.projectFileWrite()).to.throw();
      expect(() => api.projectFileWrite(projectId)).to.throw();
      expect(() => api.projectFileWrite(projectId, namespace)).to.throw();
      expect(() => api.projectFileWrite(projectId, namespace, fileName)).to.throw();

      //check string
      expect(() => api.projectFileWrite(projectId, namespace, fileName, {})).to.throw();
    });

    it('projectFileWrite() should write a file');

    it('projectFileWrite() should return the latest version, or "latest" in local');

    it('readProjectFile() should read a file which exists');

    it('projectFileWrite() should write a file, projectFileRead() should get it');

    it('readProjectFile() should 404 when file doesnt exist');

    it('listProjectFiles() should give list of files made');
  });
});
