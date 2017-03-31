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
import uuid from 'uuid';
import * as jobFiles from '../../../server/files/jobs';

//note - jobs and project files are basically the same, so not differentiating between local and remote suite

describe('Server', () => {
  describe('Jobs', () => {
    describe('files', () => {
      const projectId = `project-${uuid.v4()}`;
      const contents = `Here
Are
Some
Contents!`;
      const contentBuffer = new Buffer('here are some contents!', 'utf8');
      const namespace = 'myNamespace';
      let fileName;

      it('jobFileWrite() requires contents, namespace, and can generate key', () => {
        expect(() => jobFiles.jobFileWrite()).to.throw();
        expect(() => jobFiles.jobFileWrite(projectId)).to.throw();
        expect(() => jobFiles.jobFileWrite(projectId, namespace)).to.throw();
        expect(() => jobFiles.jobFileWrite(projectId, namespace, 'some contents')).to.not.throw();       // write #1
      });

      //note - job files dont return a version, just project files.
      it('jobFileWrite() returns Key, name', () => {
        return jobFiles.jobFileWrite(projectId, namespace, contents)                                     // write #2
        .then(result => {
          assert(typeof result === 'object');

          assert(result.name, 'should have a name');
          fileName = result.name;

          assert(result.Key, 'should have a key');
          assert(result.Key.indexOf(fileName) > 0, 'name should be in Key');
        });
      });

      it('jobFileRead() returns contents', () => {
        return jobFiles.jobFileRead(projectId, namespace, fileName)
        .then(fileContent => {
          expect(fileContent).to.equal(contents);
        });
      });

      it('jobFileWrite() works with a buffer', () => {
        return jobFiles.jobFileWrite(projectId, namespace, contentBuffer)                              // write #3
        .then(result => {
          assert(result.Key, 'should have a key');
        });
      });

      it('jobFileList() lists files', () => {
        return jobFiles.jobFileList(projectId, namespace)
        .then(results => {
          expect(results.length).to.equal(3);
          assert(results.some(item => item.indexOf(fileName)) >= 0);
        });
      });

      const fileSigned = uuid.v4();
      const fileSignedContents = 'my string';

      it('can write to a signed url', () => {
        const url = jobFiles.jobFileSignedUrl(projectId, namespace, fileSigned, 'putObject');

        return fetch(url, { method: 'PUT', body: fileSignedContents })
        .then(resp => {
          assert(resp.status === 200);
        });
      });

      it('can read from a signed url', () => {
        const url = jobFiles.jobFileSignedUrl(projectId, namespace, fileSigned, 'getObject');

        return fetch(url, { method: 'GET' })
        .then(resp => {
          assert(resp.status === 200, 'should get 200');
          return resp.text();
        })
        .then(txt => {
          assert(txt === fileSignedContents, 'contents should match');
        });
      });
    });
  });
});
