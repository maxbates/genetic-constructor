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
import { getLocal } from '../utils/ui/localstorage.js';
import { headersGet, headersPost } from './utils/headers';
import { dataApiPath } from './utils/paths';

const getSequenceUrl = (md5, format = null, blockId = null, projectId) => dataApiPath(`sequence/${md5}` + (!!blockId ? `/${blockId}` : ''));

const cacheSequence = (md5, sequence) => {
  //do nothing for now...
  //setLocal(md5, sequence);
};

export const getSequence = (md5, format) => {
  const url = getSequenceUrl(md5, format);

  const cached = getLocal(md5);
  if (cached) {
    return Promise.resolve(cached);
  }

  return rejectingFetch(url, headersGet())
    .then((resp) => resp.text())
    .then(sequence => {
      cacheSequence(md5, sequence);
      return sequence;
    });
};

export const writeSequence = (md5, sequence, blockId, projectId) => {
  const url = getSequenceUrl(md5, null, blockId, projectId);
  const stringified = JSON.stringify({ sequence });

  cacheSequence(md5, sequence);

  return rejectingFetch(url, headersPost(stringified));
};
