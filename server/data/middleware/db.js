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
import { STORAGE_URL } from '../../urlConstants';
import rejectingFetch from '../../../src/middleware/utils/rejectingFetch';
import * as headers from '../../../src/middleware/utils/headers';

const makePath = path => STORAGE_URL + path;

const defaultHeaders = {
  Accept: 'application/json',
};

export const dbGet = (path, params = {}) => {
  const fetchParams = Object.assign({}, defaultHeaders, params);
  return rejectingFetch(makePath(path), headers.headersGet(fetchParams))
    .then(resp => resp.json());
};

export const dbPost = (path, userId, data, params = {}, bodyParams = {}) => {
  const body = JSON.stringify(Object.assign({}, bodyParams, {
    owner: userId,
    data,
  }));

  const fetchParams = Object.assign({}, defaultHeaders, params);
  return rejectingFetch(makePath(path), headers.headersPost(body, fetchParams))
    .then(resp => resp.json())
    .catch(err => {
      console.log('got error posting', err);

      return Promise.reject(err);
    });
};

export const dbDelete = (path, params = {}) => {
  const fetchParams = Object.assign({}, defaultHeaders, params);
  return rejectingFetch(makePath(path), headers.headersDelete(fetchParams))
    .then(resp => resp.json());
};

export const dbPruneResult = (json) => json.data;
