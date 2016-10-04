import chai from 'chai';
import fs from 'fs';
import * as fileApi from '../../src/middleware/file';
const { assert, expect } = chai;
import { createFilePath } from '../../server/utils/filePaths';

const makeStoragePath = (path) => createFilePath(path);

describe('Middleware', () => {
  describe('Files', () => {
    it('writeFile() should take path and string, and write file', function writeFileBasic(done) {
      const filePath = 'test/writeMe';
      const fileContents = 'rawr';
      const storagePath = makeStoragePath(filePath);

      return fileApi.writeFile(filePath, fileContents)
        .then((res) => {
          expect(res.status).to.equal(200);
          fs.readFile(storagePath, 'utf8', (err, file) => {
            expect(err).to.eql(null);
            expect(file).to.eql(fileContents);
            done();
          });
        })
        .catch(done);
    });

    it('writeFile() shuold delete if contents are null', function writeFileDelete(done) {
      const filePath = 'test/deletable';
      const fileContents = 'oopsie';
      const storagePath = makeStoragePath(filePath);

      fs.writeFile(storagePath, fileContents, 'utf8', (err, write) => {
        fileApi.writeFile(filePath, null)
          .then((res) => {
            expect(res.status).to.equal(200);
            fs.readFile(storagePath, 'utf8', (err, read) => {
              expect(err.code).to.equal('ENOENT');
              done();
            });
          })
          .catch(done);
      });
    });

    it('readFile() should return fetch response object', function readFileTest(done) {
      const filePath = 'test/readable';
      const fileContents = 'the contents!';
      const storagePath = makeStoragePath(filePath);

      fs.writeFile(storagePath, fileContents, 'utf8', (err, write) => {
        fileApi.readFile(filePath)
          .then(result => {
            expect(result.status).to.equal(200);
            expect(typeof result.text).to.equal('function');
            return result.text();
          })
          .then(text => {
            expect(text).to.equal(fileContents);
            done();
          })
          .catch(done);
      });
    });

    it('readFile / writeFile should work with multiple files', function multipleFiles(done) {
      const file1Path = 'test/file1';
      const file1Contents = 'exhibit a';
      const storage1Path = makeStoragePath(file1Path);

      const file2Path = 'test/file2';
      const file2Contents = 'exhibit b';
      const storage2Path = makeStoragePath(file2Path);

      Promise
        .all([
          fileApi.writeFile(file1Path, file1Contents),
          fileApi.writeFile(file2Path, file2Contents),
        ])
        .then(files => {
          fs.readFile(storage1Path, 'utf8', (err, read) => {
            expect(read).to.equal(file1Contents);
          });
          fs.readFile(storage2Path, 'utf8', (err, read) => {
            expect(read).to.equal(file2Contents);
          });
        })
        .then(() => {
          return Promise.all([
            fileApi.readFile(file1Path).then(resp => resp.text()),
            fileApi.readFile(file2Path).then(resp => resp.text()),
          ]);
        })
        .then(files => {
          expect(files[0]).to.equal(file1Contents);
          expect(files[1]).to.equal(file2Contents);
          done();
        })
        .catch(done);
    });
  });
});
