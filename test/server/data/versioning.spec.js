import { assert, expect } from 'chai';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { exec } from 'child_process'; //todo - promise version
import { createStorageUrl } from '../../../server/utils/filePaths';
import * as versioning from '../../../server/data/git-deprecated/git';
import { fileExists, fileRead, fileWrite, fileDelete, directoryMake, directoryDelete } from '../../../server/utils/fileSystem';
import { errorDoesNotExist } from '../../../server/utils/errors';

describe('Server', () => {
  describe('Data', () => {
    describe('versioning', function gitTests() {
      this.timeout(10000);
      const pathRepo = createStorageUrl('testrepo');
      before(() => directoryMake(pathRepo));

      describe('initialization', () => {
        it('initialize() should initialize a repo', (done) => {
          versioning.initialize(pathRepo)
            .then(() => {
              exec(`cd ${pathRepo} && git status`, (err, result) => {
                assert(result.indexOf('On branch master') >= 0);
                done(err);
              });
            })
            .catch(done);
        });

        it('isInitialized() checks if initialized - true if is', () => {
          return versioning.isInitialized(pathRepo)
            .then(result => {
              assert(result === true);
            });
        });

        it('isInitialized() checks if initialized - false if not', () => {
          const uninitPath = 'uninitPath';
          return versioning.isInitialized(uninitPath)
            .then(result => {
              assert(result === false);
            });
        });
      });

      describe('commit()', () => {
        const file1Path = path.resolve(pathRepo, 'testFile');
        const file1Contents = 'dummy contents';
        const commitMessage = 'my commit';
        let commitSha;

        before((done) => {
          fileWrite(file1Path, file1Contents, false)
            .then(() => versioning.commit(pathRepo, commitMessage))
            .then((sha) => {
              commitSha = sha;
              done();
            })
            .catch(done);
        });

        it('commit() should add all the files', (done) => {
          exec(`cd ${pathRepo} && git status`, (err, out) => {
            assert(out.indexOf('working directory clean') >= 0);
            done(err);
          });
        });

        it('commit() should accept a message', (done) => {
          exec(`cd ${pathRepo} && git log`, (err, out) => {
            assert(out.indexOf(commitMessage) >= 0);
            done(err);
          });
        });

        it('commit() should add a commit', (done) => {
          exec(`cd ${pathRepo} && git log`, (err, out) => {
            assert(out.indexOf(commitSha) >= 0);
            done(err);
          });
        });

        it('should handle removing a file', (done) => {
          fileDelete(file1Path)
            .then(() => versioning.commit(pathRepo, 'file deleted'))
            .then((sha) => {
              exec(`cd ${pathRepo} && git ls-files`, (err, output) => {
                assert(output.indexOf(file1Path) < 0);
                done();
              });
            });
        });

        it('getCommit(path, sha) returns the commit for a given SHA', () => {
          return versioning.getCommit(pathRepo, commitSha)
            .then(commit => {
              expect(commit.message).to.equal(commitMessage);
              expect(commit.sha).to.equal(commitSha);
              expect(commit.date).to.be.defined;
            });
        });
      });

      describe('log()', () => {
        it('returns a list of commits with specific fields', (done) => {
          versioning.log(pathRepo)
            .then(commits => {
              assert(Array.isArray(commits));
              assert(commits.every(commit => {
                return commit.sha && commit.author && commit.date && commit.message;
              }));
              done();
            })
            .catch(done);
        });
      });

      describe('versionExists()', () => {
        const fileName = 'rewritable';
        const filePath = path.resolve(pathRepo, fileName);
        const fileContents_A = 'initial contents';
        const fileContents_B = 'alternative internals';
        const fileContents_C = 'final things';
        let sha1;
        let sha2;

        before(() => {
          return versioning.initialize(pathRepo)
            .then(() => fileWrite(filePath, fileContents_A, false))
            .then(() => versioning.commit(pathRepo, 'first commit'))
            .then((sha) => {
              sha1 = sha;
              return fileWrite(filePath, fileContents_B);
            })
            .then(() => versioning.commit(pathRepo, 'second commit'))
            .then((sha) => {
              sha2 = sha;
              return fileWrite(filePath, fileContents_C, false);
            })
            .then(() => versioning.commit(pathRepo, 'third commit'));
        });

        it('rejects on invalid commit', () => {
          return versioning.versionExists(pathRepo, 'invalid')
            .then(result => assert(false, 'should not resolve'))
            .catch(err => assert(err === errorDoesNotExist, 'wrong error type -> function errored...'));
        });

        it('checks for commit if no file passed', () => {
          return versioning.versionExists(pathRepo, sha2);
        });

        it('checks file at specific SHA', () => {
          return versioning.versionExists(pathRepo, sha2, fileName);
        });

        it('defaults to HEAD when pass a file', () => {
          return versioning.versionExists(pathRepo, undefined, fileName);
        });
      });

      describe('checkout()', () => {
        const fileName = 'rewritable';
        const filePath = path.resolve(pathRepo, fileName);
        const fileContents_A = 'initial contents';
        const fileContents_B = 'alternative internals';
        let sha1;
        let sha2;

        before(() => {
          return fileWrite(filePath, fileContents_A, false)
            .then(() => versioning.commit(pathRepo, 'first commit'))
            .then((sha) => {
              sha1 = sha;
              return fileWrite(filePath, fileContents_B);
            })
            .then(() => versioning.commit(pathRepo, 'second commit'))
            .then((sha) => {
              sha2 = sha;
            });
        });

        it('checkout(path, file, sha) gets file at specific version', () => {
          return versioning.checkout(pathRepo, fileName, sha1)
            .then(fileContents => {
              expect(fileContents).to.equal(fileContents_A);
            });
        });

        it('does not persist checkouts for subsequent calls', () => {
          return versioning.checkout(pathRepo, fileName, sha1)
            .then(fileContents => {
              exec(`cd ${pathRepo} && git rev-parse HEAD`, (err, output) => {
                const [ headSha ] = output.split('\n');
                expect(headSha).to.equal(sha2);
              });
            });
        });
      });
    });
  });
});
