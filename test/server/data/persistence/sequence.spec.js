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
import path from 'path';
import md5 from 'md5';
import uuid from 'node-uuid';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
} from '../../../../server/utils/fileSystem';
import { validPseudoMd5, generatePseudoMd5, parsePseudoMd5 } from '../../../../src/utils/sequenceMd5';
import * as filePaths from '../../../../server/utils/filePaths';
import * as persistence from '../../../../server/data/persistence';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe.only('sequence', function persistenceTests() {
        const rangeStart = 20;
        const rangeEnd = 35;
        const sequence = 'ACTAGCTAGCTAGCTGACTAGCTAGCTGATCGTAGCGATCTACTGATCAGCTACTGTACGTACGTGACTG';
        const rangedSequence = sequence.substring(rangeStart, rangeEnd);

        const realMd5 = md5(sequence);
        const pseudoMd5 = generatePseudoMd5(realMd5, rangeStart, rangeEnd);

        const filePath = filePaths.createSequencePath(realMd5);

        it('generatePseudoMd5() should be in form md5[start:end]', () => {
          expect(pseudoMd5).to.equal(`${realMd5}[${rangeStart}:${rangeEnd}]`);
        });

        it('parsePseudoMd5() should parse properly', () => {
          const parsed = parsePseudoMd5(pseudoMd5);
          expect(parsed).to.eql({
            original: pseudoMd5,
            hash: realMd5,
            byteRange: `[${rangeStart}:${rangeEnd}]`,
            start: rangeStart,
            end: rangeEnd,
          });
        });

        it('sequenceWrite() should write a sequence', () => {
          return persistence.sequenceWrite(realMd5, sequence)
            .then(() => fileRead(filePath, false))
            .then(read => {
              expect(read).to.equal(sequence);
            });
        });

        it('sequenceWrite() should not write a sequence specifying a range', () => {
          expect(() => persistence.sequenceWrite(pseudoMd5, sequence)).to.throw();
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

        it('sequenceWriteMany() should take map of md5 to sequence');

        it('sequenceWriteChunks() takes sequence and rangeMap, returns block to pseudoMd5', () => {
          const sequence = 'actacgtacgtacgagcactgcgtagctgatcagctgctgactgactgatcgacgtagcagctacgtagctagc';
          const sequenceMd5 = md5(sequence);
          const range1 = [5, 15];
          const range2 = [10, 30];

          const rangeMap = {
            id1: range1,
            id2: range2,
          };

          return persistence.sequenceWriteChunks(sequence, rangeMap)
            .then(result => {
              expect(result.id1).to.equal(generatePseudoMd5(sequenceMd5, range1[0], range1[1]));
              expect(result.id2).to.equal(generatePseudoMd5(sequenceMd5, range2[0], range2[1]));

              return persistence.sequenceGet(result.id1)
                .then(seqResult => {
                  expect(seqResult).to.equal(sequence.substring(range1[0], range1[1]));
                });
            });
        });
      });
    });
  });
});