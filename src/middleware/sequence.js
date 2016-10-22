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
import rejectingFetch from './utils/rejectingFetch';
import invariant from 'invariant';
import _ from 'lodash';
import { headersGet, headersPost } from './utils/headers';
import { dataApiPath } from './utils/paths';
import { validRealMd5, generatePseudoMd5, dedupeBlocksToMd5s, remapDedupedBlocks } from '../utils/sequenceMd5';

const getSequenceUrl = (md5, range) => {
  if (range) {
    invariant(Array.isArray(range) && range.length === 2, 'range must be an array');
    invariant(validRealMd5(md5), 'cannot have byte range in md5 if specify a range');
    const psuedoMd5 = generatePseudoMd5(md5, range);
    return dataApiPath(`sequence/${psuedoMd5}]`);
  }
  return dataApiPath(`sequence/${md5}`);
};

const cacheSequence = (md5, sequence) => {
  //do nothing for now... will need to handle byte range somehow
  //setLocal(md5, sequence);
};

//expects pseudoMd5, or realMd5 and optional range
export const getSequence = (md5, range) => {
  if (!md5) {
    return Promise.resolve(null);
  }

  const url = getSequenceUrl(md5, range);

  //const cached = getLocal(md5);
  //if (cached) {
  //  return Promise.resolve(cached);
  //}

  return rejectingFetch(url, headersGet())
    .then((resp) => resp.text())
    .then(sequence => {
      cacheSequence(md5, sequence);
      return sequence;
    });
};

//expects map in form { blockId: pseudoMd5 }
export const getSequences = (blockIdsToMd5s) => {
  //generates map { realMd5: range }
  const rangeMap = dedupeBlocksToMd5s(blockIdsToMd5s);

  //calc ahead to perserve order in case of object key issues, since promise.all works on arrays
  const hashes = Object.keys(rangeMap);

  return Promise.all(
    hashes.map(hash => getSequence(hash, rangeMap[hash]))
  )
    .then(sequences => {
      // { realMd5: sequenceDedupedRange }
      const hashToSequence = _.zip(hashes, sequences);

      return remapDedupedBlocks(hashToSequence, rangeMap, blockIdsToMd5s);
    });
};

export const writeSequence = (md5, sequence, blockId, projectId) => {
  const url = getSequenceUrl(md5, null, blockId, projectId);
  const stringified = JSON.stringify({ sequence });

  cacheSequence(md5, sequence);

  return rejectingFetch(url, headersPost(stringified));
};
