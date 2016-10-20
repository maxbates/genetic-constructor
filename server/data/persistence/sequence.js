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
import invariant from 'invariant';
import { every, mapValues, chunk } from 'lodash';
import md5 from 'md5';
import * as s3 from './s3';
import * as filePaths from '../../utils/filePaths';
import {
  errorDoesNotExist,
} from '../../utils/errors';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
} from '../../utils/fileSystem';
import { validPseudoMd5, generatePseudoMd5, parsePseudoMd5 } from '../../../src/utils/sequenceMd5';
import DebugTimer from '../../utils/DebugTimer';

//todo - may need userId / projectId to address privacy concerns

/* S3 Credentials, when in production */

export const bucketName = 'bionano-gctor-sequences';

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
}

/* end S3 setup */

export const sequenceExists = (pseudoMd5) => {
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash } = parsePseudoMd5(pseudoMd5);

  if (s3.useRemote) {
    return s3.objectExists(s3bucket, hash)
      .catch(err => errorDoesNotExist);
  }

  const sequencePath = filePaths.createSequencePath(pseudoMd5);
  return fileExists(sequencePath)
    .then(() => sequencePath);
};

export const sequenceGet = (pseudoMd5) => {
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash, start, end } = parsePseudoMd5(pseudoMd5);

  if (s3.useRemote) {
    //s3 is inclusive, node fs is not, javascript is not
    const correctedEnd = end - 1;
    const params = start >= 0 ? { Range: `bytes=${start}-${correctedEnd}` } : {};
    return s3.stringGet(s3bucket, hash, params);
  }

  return sequenceExists(hash)
    .then(path => fileRead(path, false, { start, end }));
};

export const sequenceWrite = (realMd5, sequence) => {
  invariant(validPseudoMd5(realMd5), 'must pass a valid md5 with optional byte range');
  const { hash, byteRange } = parsePseudoMd5(realMd5);
  invariant(!byteRange, 'should not pass md5 with byte range to sequence write');

  if (!sequence || !sequence.length) {
    return Promise.resolve();
  }

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

//expect object, map of md5 (not pseudoMd5) to sequence
export const sequenceWriteMany = (map) => {
  invariant(typeof map === 'object', 'must pass an object');

  const timer = new DebugTimer('sequenceWriteMany', { disabled: true });
  const batches = chunk(Object.keys(map), 50);

  return batches.reduce((acc, batch) => {
    //promise for each batch
    return acc.then((allWrites) => {
      //sequenceWrite for each member of batch
      return Promise.all(batch.map(pseudoMd5 => sequenceWrite(pseudoMd5, map[pseudoMd5])))
        .then((createdBatch) => {
          timer.time('(sequenceWriteMany) made + wrote a chunk');
          return allWrites.concat(createdBatch);
        });
    });
  }, Promise.resolve([]))
    .then((allWrites) => {
      timer.end('all sequences written');
      return map;
    });
};

//expects a long sequence, and map { blockId: [start:end] }
//returns { blockId: pseudoMd5 } where psuedoMd5 is sequnceMd5[start:end]
export const sequenceWriteChunks = (sequence, rangeMap) => {
  invariant(sequence && sequence.length > 0, 'must pass a sequence with length');
  invariant(typeof rangeMap === 'object', 'range map just be an object');
  invariant(every(rangeMap, (range) => Array.isArray(range) && Number.isInteger(range[0]) && Number.isInteger(range[1])), 'every range should be an array: [start:end]');

  const sequenceMd5 = md5(sequence);

  return sequenceWrite(sequenceMd5, sequence)
    .then(() => {
      return mapValues(rangeMap, (range, blockId) => {
        return generatePseudoMd5(sequenceMd5, range[0], range[1]);
      });
    });
};

//probably dont want to let people do this, since sequence may be referenced by multiple blocks...
export const sequenceDelete = (pseudoMd5) => {
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash, byteRange } = parsePseudoMd5(pseudoMd5);
  invariant(!byteRange, 'should not pass md5 with byte range to sequence delete');

  if (s3.useRemote) {
    return s3.objectDelete(s3bucket, hash)
      .then(() => pseudoMd5);
  }

  return sequenceExists(pseudoMd5)
    .then(path => fileDelete(path));
};

//synchronous
//s3 only
export const sequenceGetRemoteUrl = (pseudoMd5) => {
  invariant(s3.useRemote, 'only can get URL when using S3 -- otherwise, in file system, and just use REST API');
  invariant(validPseudoMd5(pseudoMd5), 'must pass a valid md5 with optional byte range');
  const { hash } = parsePseudoMd5(pseudoMd5);

  return s3.getSignedUrl(s3bucket, hash, 'getObject');
};
