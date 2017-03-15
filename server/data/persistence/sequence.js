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
import debug from 'debug';
import invariant from 'invariant';
import _, { chunk, every, mapValues } from 'lodash';
import md5 from 'md5';

import { generatePseudoMd5, getSequencesFromMap, parsePseudoMd5, validPseudoMd5 } from '../../../src/utils/sequenceMd5';
import * as filePaths from '../middleware/filePaths';
import * as agnosticFs from '../../files/agnosticFs';
import { fileDelete, fileExists, fileRead, fileWrite } from '../middleware/fileSystem';
import * as s3 from '../middleware/s3';

const logger = debug('constructor:data:persistence:sequence');

/* S3 Credentials, when in production */

export const bucketName = 'bionano-gctor-sequences';

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
  logger(`Bucket: ${bucketName}`);
} else {
  s3bucket = filePaths.createSequencePath();
  logger(`File Path: ${s3bucket}`);
}

// BASIC OPERATIONS

export const sequenceExists = (pseudoMd5) => {
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash, hasRange } = parsePseudoMd5(pseudoMd5);

  logger(`[sequenceExists] ${hash}${hasRange ? `(original: ${pseudoMd5})` : ''}`);

  if (s3.useRemote) {
    return s3.itemExists(s3bucket, hash);
  }

  const sequencePath = filePaths.createSequencePath(hash);
  return fileExists(sequencePath)
  .then(() => sequencePath);
};

export const sequenceGet = (pseudoMd5) => {
  if (!pseudoMd5) {
    return Promise.resolve(null);
  }

  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash, hasRange, start, end } = parsePseudoMd5(pseudoMd5);

  logger(`[sequenceExists] ${hash}${hasRange ? `(original: ${pseudoMd5})` : ''}`);

  if (s3.useRemote) {
    //s3 is inclusive, node fs is not, javascript is not
    const correctedEnd = end - 1;
    const params = hasRange ? { Range: `bytes=${start}-${correctedEnd}` } : {};
    return s3.stringGet(s3bucket, hash, params);
  }

  const sequencePath = filePaths.createSequencePath(hash);
  return fileRead(sequencePath, false, hasRange ? { start, end } : {});
};

//expects map { blockId: pseudoMd5 }
//returns map { blockId: sequence }
//dedupes requests across multiple files and fetches union byte range
export const sequenceGetMany = blockIdToMd5Map => getSequencesFromMap(blockIdToMd5Map, seqMd5 => sequenceGet(seqMd5));

export const sequenceWrite = (realMd5, sequence) => {
  invariant(validPseudoMd5(realMd5), 'must pass a valid md5 with optional byte range');
  invariant(typeof sequence === 'string', `sequence must be string, got ${sequence}`);

  const { hash, byteRange } = parsePseudoMd5(realMd5);
  invariant(!byteRange, 'should not pass md5 with byte range to sequence write');

  if (!sequence || !sequence.length) {
    return Promise.resolve();
  }

  logger(`[sequenceWrite] ${hash} - ${sequence.substr(0, 20)}...`);

  if (s3.useRemote) {
    //checking if it exists slows everything down, but ideally dont want to write and make new versions if we dont have to (s3 lacks file locking)
    return s3.stringPut(s3bucket, hash, sequence);
  }

  const sequencePath = filePaths.createSequencePath(hash);

  //do nothing if it already exists, only write if it doesnt
  return fileExists(sequencePath)
  .catch(() => fileWrite(sequencePath, sequence, false))
  .then(() => sequence);
};

//expect object { md5 (not pseudoMd5) : sequence }
//returns { md5 : sequence }
export const sequenceWriteMany = (map) => {
  invariant(typeof map === 'object', 'must pass an object');
  logger(`[sequenceWriteMany] starting... ${Object.keys(map).length}`);
  //logger(JSON.stringify(map, null, 2));

  const batches = chunk(Object.keys(map), 50);

  return batches.reduce((acc, batch) =>
    //promise for each batch
    acc.then(allWrites =>
      //sequenceWrite for each member of batch
      Promise.all(batch.map(pseudoMd5 => sequenceWrite(pseudoMd5, map[pseudoMd5])))
      .then((createdBatch) => {
        logger('[sequenceWriteMany] batch completed');
        return allWrites.concat(createdBatch);
      })), Promise.resolve([]))
  .then((allWrites) => {
    logger('[sequenceWriteMany] all batches completed');
    return map;
  });
};

//expects a long sequence, and map { blockId: [start:end] }
//returns { blockId: pseudoMd5 } where psuedoMd5 is sequnceMd5[start:end] or true (for whole sequence)
export const sequenceWriteChunks = (sequence, rangeMap) => {
  invariant(sequence && sequence.length > 0, 'must pass a sequence with length');
  invariant(typeof rangeMap === 'object', 'range map must be an object');
  invariant(every(rangeMap, range => range === true || (Array.isArray(range) && Number.isInteger(range[0]) && Number.isInteger(range[1]))), 'every range should be null (for whole thing), an array: [start:end]');

  logger(`[sequenceWriteChunks] starting... ${sequence.length}bp, ${Object.keys(rangeMap).length} ranges`);

  const sequenceMd5 = md5(sequence);

  return sequenceWrite(sequenceMd5, sequence)
  .then(() => mapValues(rangeMap, (range, blockId) => {
    if (range === true) {
      return sequenceMd5;
    }
    if (range[0] === 0 && range[1] === sequence.length - 1) {
      return sequenceMd5;
    }
    return generatePseudoMd5(sequenceMd5, range[0], range[1]);
  }));
};

//probably dont want to let people do this, since sequence may be referenced by multiple blocks...
export const sequenceDelete = (pseudoMd5) => {
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash, byteRange } = parsePseudoMd5(pseudoMd5);
  invariant(!byteRange, 'should not pass md5 with byte range to sequence delete');

  logger(`[sequenceDelete] Deleting ${pseudoMd5}`);

  if (s3.useRemote) {
    return s3.itemDelete(s3bucket, hash)
    /*
     //if we want to hide the fact that it existed.... but this never gets called by the app anyway
     //note that local version checks for existence and wll return this error as well
     .catch(err => {
     if (err === errorDoesNotExist) {
     //we dont want to tell them
     return Promise.reject();
     }
     })
     */
    .then(() => pseudoMd5);
  }

  return sequenceExists(pseudoMd5)
  .then(path => fileDelete(path));
};

// ROLLUP METHODS

// given rollup with sequences field, write all sequences and update rollup
// not part of rollup class because direct line to persistence, wouldn't work on client
/* expects rollup (not frozen):
 * { blocks: <blockMap>,
 *   sequences: [
 *     { sequence: <string>,
 *       blocks: { [blockId]: [start, end] || true }
 *     },
 *     ...
 *   ]
 * }
 *
 *
 * an alternative format for sequences (to be deprecated):
 * todo - deprecate this format. If anything, should pass in the form { blockId: sequence } and we'll set the md5 etc. extensions should not have to do this hashing
 * object: assumes blocks already defined properly
 * { md5: sequence }
 * does not update the rollup, since blocks are assumed to have the correct md5 already
 */
// returns updated rollup (updated in place)
export const sequenceWriteManyChunksAndUpdateRollup = (rollup) => {
  const { blocks, sequences = {} } = rollup;

  if (Array.isArray(sequences)) {
    invariant(_.every(sequences, seqObj => typeof seqObj.sequence === 'string' && typeof seqObj.blocks === 'object'), 'sequences object in wrong format');

    //filter so we can know the lengths later
    const filtered = _.filter(sequences, seqObj => seqObj && seqObj.sequence && seqObj.sequence.length > 0);

    //creates map blockId to full sequence
    //this is dumb, but need way to get whole sequence from blockId, don't get when parse pseudoMd5
    const blockToSequenceLength = _.reduce(filtered, (acc, { sequence, blocks }) => {
      const blockToSequenceMap = _.mapValues(blocks, () => sequence.length);
      return Object.assign(acc, blockToSequenceMap);
    }, {});

    return Promise.all(
      filtered.map(({ sequence, blocks }) => sequenceWriteChunks(sequence, blocks)),
    )
    .then((blockMd5Maps) => {
      //make simgle object with all { blockId : md5 } map
      const blockMd5s = Object.assign({}, ...blockMd5Maps);

      _.forEach(blockMd5s, (pseudoMd5, blockId) => {
        const { hasRange, start, end } = parsePseudoMd5(pseudoMd5);
        const fullLength = blockToSequenceLength[blockId];
        _.merge(blocks[blockId], {
          sequence: {
            md5: pseudoMd5,
            length: hasRange ? end - start : fullLength,
          },
        });
      });
    })
    .then(() => {
      delete rollup.sequences;
      return rollup;
    });
  }

  //otherwise, we got the object format, no updating needed since we are getting md5s, the blocks already know what their sequences are, and no need to update
  return sequenceWriteMany(sequences)
  .then(() => {
    delete rollup.sequences;
    return rollup;
  });
};

/**
 * Given a rollup, get all the sequences for blocks in the form: { blockId : sequence }
 * @param rollup
 * @returns rollup, with sequence map: { project: {}, blocks: {}, sequences: { <blockId>: 'ACAGTCGACTGAC' } }
 */
export const assignSequencesToRollup = (rollup) => {
  const blockIdsToMd5s = mapValues(rollup.blocks, (block, blockId) => block.sequence.md5);

  return sequenceGetMany(blockIdsToMd5s)
  .then(sequences => Object.assign(rollup, { sequences }));
};

// REMOTE ACCESS

//synchronous
export const sequenceGetRemoteUrl = (pseudoMd5) => {
  invariant(s3.useRemote, 'only can get URL when using S3 -- otherwise, in file system, and just use REST API');
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash } = parsePseudoMd5(pseudoMd5);

  return agnosticFs.signedUrl(s3bucket, hash, 'getObject');
};
