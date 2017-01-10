/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the 'License');
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an 'AS IS' BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';

import _ from 'lodash';

import fetch from 'isomorphic-fetch';

import fs from 'fs';
import readLine from 'readline';

import { STORAGE_API } from '../../bin/migrate/config';
import batchPromises from '../../bin/migrate/batchPromises';

if (process.argv.length < 3) {
  console.error('usage: ' + process.argv[1] + ' [uuid input file]');
  process.exit(1);
}

console.error('STORAGE API:', STORAGE_API);

function rmUserData(uuid) {
  return fetch(`${STORAGE_API}/admin/owner/${uuid}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })
    .then(resp => resp.json())
    .then(result => {
      if (result.message) {
        console.error('failed to rm project data for user: ' + uuid);
        console.error(result);
        return Promise.reject(result);
      }

      console.log(uuid);
      return result;
    });
}

function rmUsers(users) {
  batchPromises(_.map(users, (uuid) => {
    return function () {
      rmUserData(uuid);
    };
  }))
    .then(() => {
      console.error('batching complete');
    });
}

let uuids = [];

const inputStream = fs.createReadStream(process.argv[2], {
  encoding: 'utf8',
});

const lineReader = readLine.createInterface({
  input: inputStream,
});

lineReader.on('line', function (line) {
  let uuid = line.trim();
  if ((uuid != null) && (uuid != "")) {
    uuids.push(uuid);
  }
});

lineReader.on('close', function () {
  return rmUsers(uuids);
});
