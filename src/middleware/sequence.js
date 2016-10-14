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
import { generatePseudoMd5, parsePseudoMd5 } from '../utils/sequenceMd5';

const getSequenceUrl = (md5, range) => {
  if (range) {
    invariant(Array.isArray(range) && range.length === 2, 'range must be an array');
    invariant(md5.indexOf('[') < 0, 'cannot have byte range in md5 if specify a range');
    const psuedoMd5 = generatePsuedoMd5(md5, range[0], range[1]);
    return dataApiPath(`sequence/${psuedoMd5}]`);
  }
  return dataApiPath(`sequence/${md5}`);
};

const cacheSequence = (md5, sequence) => {
  //do nothing for now... will need to handle byte range somehow
  //setLocal(md5, sequence);
};

//expects pseudoMd5
export const getSequence = (md5) => {
  if (!md5.length) {
    return Promise.resolve(null);
  }

  const url = getSequenceUrl(md5);

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
  //generate map { blockId: { hash, start, end } }
  const blockParsedMap = _.mapValues(blockIdsToMd5s, (acc, pseudoMd5, blockId) => parsePseudoMd5(pseudoMd5));

  // dedupe to the things we want to fetch
  // reduce to map of { md5: range }
  // where range may be `true` to fetch the whole thing, or [earliest, latest]
  const rangeMap = blockParsedMap.reduce((acc, parsedMd5) => {
    const { hash, start, end } = parsedMd5;

    //if no byte range, or already getting the whole thing, then get the whole thing
    if ((!start && !end) || acc[hash] === true) {
      return Object.assign(acc, { [hash]: true });
    }

    //if new hash, mark it
    if (!acc[hash]) {
      return Object.assign(acc, { [hash]: [start, end] });
    }

    //if we're here, have a range, and already exists, so need to expand range
    const [oldStart, oldEnd] = acc[hash];
    const nextBounds = [
      start < oldStart ? start : oldStart,
      end > oldEnd ? end : oldEnd,
    ];
    return Object.assign(acc, { [hash]: nextBounds });
  }, {});

  //calc ahead to perserve order
  const hashes = Object.keys(rangeMap);

  return Promise.all(
    hashes.map(hash => getSequenceUrl(hash, rangeMap[hash]))
  )
    .then(sequences => {
      const hashToSequence = _.zip(hashes, sequences);

      //generate blockId: sequence, normalizing for byte range requested
      return _.mapValues(blockParsedMap, (acc, parsedMd5) => {
        const { original, hash, start = 0, end } = parsedMd5;
        const range = rangeMap[hash];
        const sequence = hashToSequence[hash]; //fetch sequence... may just be a range

        // calculate normalized range
        // start depending on whether whole sequence was requested, or a fragment
        const normStart = (range === true) ? start : range[0] + start;
        // if no end defined, set to length of sequence
        const normEnd = !end ? sequence.length : normStart + (end - start);

        const normSequence = sequence.slice(normStart, normEnd);

        cacheSequence(original, normSequence);

        return normSequence;
      });
    });
};

export const writeSequence = (md5, sequence, blockId, projectId) => {
  const url = getSequenceUrl(md5, null, blockId, projectId);
  const stringified = JSON.stringify({ sequence });

  cacheSequence(md5, sequence);

  return rejectingFetch(url, headersPost(stringified));
};
