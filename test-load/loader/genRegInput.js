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

import * as lodash from 'lodash';

if (process.argv.length < 3) {
  console.error('usage: ' + process.argv[1] + ' [registration quantity]');
  process.exit(1);
}

const numClients = Number.parseInt(process.argv[2]);
console.error('Generating ' + numClients + ' registration inputs');

const emailPrefix = 'bnloadtest-';
const emailSuffix = '@hotmail.com';

let clients = [];

for(let i = 0; i < numClients; i++) {
  clients.push([emailPrefix + Date.now() + '-' + lodash.random(0, 10000 * numClients) + emailSuffix]);
}

const result = {
  version: 1,
  variables: [
    {
      names: [
        'email',
      ],
      values: clients,
    },
  ],
};

//noinspection ES6ModulesDependencies,NodeModulesDependencies
console.log(JSON.stringify(result));
process.exit(0);


//noinspection JSUnusedLocalSymbols
const sampleRegPost = {
  "user": {
    "email": "{{email}}",
    "firstName": "Load",
    "lastName": "Test",
    "password": "FooBar"
  },
  "config": {
    "projects": {
      "emptyProject" : {
        "default": true
      }
    }
  }
};
