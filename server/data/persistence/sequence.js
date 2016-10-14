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
import { chunk } from 'lodash';
import rejectingFetch from '../../../src/middleware/utils/rejectingFetch';
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
import { validPseudoMd5, parsePseudoMd5 } from '../../../src/utils/sequenceMd5';
import DebugTimer from '../../utils/DebugTimer';

//if in production, storing in S3
const useRemote = !!process.env.API_END_POINT;
const platformUrl = `${process.env.API_END_POINT}/sequence/`;

//todo - may need userId / projectId to address privacy concerns

//todo - need to include AWS credentials to handle remote reads / writes

export const sequenceExists = (md5) => {
  invariant(validPseudoMd5(md5), 'must pass a valid md5 with optional byte range');
  const { hash } = parsePseudoMd5(md5);

  if (useRemote) {
    return rejectingFetch(platformUrl + hash, {
      method: 'GET',
    })
      .catch(err => errorDoesNotExist);
  }

  const sequencePath = filePaths.createSequencePath(md5);
  return fileExists(sequencePath)
    .then(() => sequencePath);
};

export const sequenceGet = (md5) => {
  invariant(validPseudoMd5(md5), 'must pass a valid md5 with optional byte range');
  const { hash, start, end } = parsePseudoMd5(md5);

  if (useRemote) {
    //todo - verify correctness of header
    const byteHeader = start >= 0 ? { Range: `${start}-${end}` } : {};

    return rejectingFetch(platformUrl + hash, Object.assign({
      method: 'GET',
    }, byteHeader))
      .then(resp => resp.text())
      .catch(err => errorDoesNotExist);
  }

  return sequenceExists(md5)
    .then(path => fileRead(path, false, { start, end }));
};

export const sequenceWrite = (md5, sequence) => {
  invariant(validPseudoMd5(md5), 'must pass a valid md5 with optional byte range');
  const { hash, byteRange } = parsePseudoMd5(md5);
  invariant(!byteRange, 'should not pass md5 with byte range to sequence write');

  if (!sequence || !sequence.length) {
    return Promise.resolve();
  }

  if (useRemote) {
    return rejectingFetch(platformUrl + hash, Object.assign({
      method: 'POST',
    }))
      .then(resp => resp.text())
      .catch(err => errorDoesNotExist);
  }

  const sequencePath = filePaths.createSequencePath(hash);

  //do nothing if it already exists, only write if it doesnt
  return fileExists(sequencePath)
    .catch(() => fileWrite(sequencePath, sequence, false))
    .then(() => sequence);
};

//expect object, map of md5 to sequence
//todo - could support array, and compute md5 ourselves
export const sequenceWriteMany = (map) => {
  invariant(typeof map === 'object', 'must pass an object');

  const timer = new DebugTimer('sequenceWriteMany', { disabled: true });
  const batches = chunk(Object.keys(map), 50);

  return batches.reduce((acc, batch) => {
    //promise for each batch
    return acc.then((allWrites) => {
      //sequenceWrite for each member of batch
      return Promise.all(batch.map(md5 => sequenceWrite(md5, map[md5])))
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

//probably dont want to let people do this, since sequence may be referenced by multiple blocks...
export const sequenceDelete = (md5) => {
  invariant(validPseudoMd5(md5), 'must pass a valid md5 with optional byte range');
  const { hash, byteRange } = parsePseudoMd5(md5);
  invariant(!byteRange, 'should not pass md5 with byte range to sequence delete');

  if (useRemote) {
    return rejectingFetch(platformUrl + hash, Object.assign({
      method: 'DELETE',
    }))
      .then(resp => md5)
  }

  return sequenceExists(md5)
    .then(path => fileDelete(path));
};
