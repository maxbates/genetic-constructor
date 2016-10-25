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

const getUserId = (req) => req.user.uuid;

export const dbGet = (req, path, params = {}) => {
  return rejectingFetch(makePath(path), headers.headersGet(params))
    .then(resp => resp.json);
};

export const dbPost = (req, path, data, params = {}, bodyParams = {}) => {
  const body = Object.assign({}, bodyParams, {
    owner: getUserId(req),
    data,
  });

  return rejectingFetch(makePath(path), headers.headersPost(body, params))
    .then(resp => resp.json);
};

export const dbDelete = (req, path, params) => {
  return rejectingFetch(makePath(path), headers.headersDelete(params))
    .then(resp => resp.json);
};

export const dbPruneResult = (json) => json.data;
