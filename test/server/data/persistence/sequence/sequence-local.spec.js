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
import md5 from 'md5';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
  directoryExists,
  directoryMake,
  directoryDelete
} from '../../../../../server/utils/fileSystem';
import { validPseudoMd5, generatePseudoMd5, parsePseudoMd5 } from '../../../../../src/utils/sequenceMd5';

import * as filePaths from '../../../../../server/utils/filePaths';
import * as persistence from '../../../../../server/data/persistence';
import * as s3 from '../../../../../server/data/persistence/s3';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('sequence', () => {
        describe('local', () => {
          const rangeStart = 20;
          const rangeEnd = 35;
          const sequence = 'ACTAGCTAGCTAGCTGACTAGCTAGCTGATCGTAGCGATCTACTGATCAGCTACTGTACGTACGTGACTG';
          const rangedSequence = sequence.substring(rangeStart, rangeEnd);

          const realMd5 = md5(sequence);
          const pseudoMd5 = generatePseudoMd5(realMd5, rangeStart, rangeEnd);

          const filePath = filePaths.createSequencePath(realMd5);

          //skip test suite if not using s3
          before(function () {
            if (s3.useRemote) {
              this.skip();
            }
          });

          it('sequenceRead() should read a sequence', () => {
            const seq = 'CAGTCAGCTGACTAGCTACGATCGACTG';
            const seqMd5 = md5(sequence);
            const path = filePaths.createSequencePath(seqMd5);

            return fileWrite(path, seq)
              .then(() => persistence.sequenceGet(seqMd5))
              .then(retrieved => {
                expect(retrieved).to.equal(seq);
              });
          });

          it('sequenceWrite() should write a sequence', () => {
            return persistence.sequenceWrite(realMd5, sequence)
              .then(() => fileRead(filePath, false))
              .then(read => {
                expect(read).to.equal(sequence);
              });
          });

          it('sequenceRead() should read a sequence', () => {
            return fileRead(filePath, false)
              .then(fileResult => {
                assert(fileResult === sequence, 'sequence should be written already');

                return persistence.sequenceGet(realMd5)
                  .then(getResult => {
                    expect(getResult).to.equal(fileResult);
                    expect(getResult).to.equal(sequence);
                  });
              });
          });

          it('sequenceRead() should read a sequence when md5 is specifying a range', () => {
            return fileRead(filePath, false)
              .then(fileResult => {
                assert(fileResult === sequence, 'sequence should be written already');

                return persistence.sequenceGet(pseudoMd5)
                  .then(getResult => {
                    expect(getResult).to.equal(rangedSequence);
                  });
              });
          });
        });
      });
    });
  });
});
