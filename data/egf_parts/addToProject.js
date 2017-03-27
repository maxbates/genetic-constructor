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

// script for generating a new EGF project and adding it to your own projects via the clipboard in the constructor app

import fs from 'fs';
import fetch from 'isomorphic-fetch';

import makeEgfRollup from './index';

// todo
// constructor.store.getState().user.userid

const userId = "5cbb9e40-0e58-11e7-8b80-bd78c977624f";

////////////

const roll = makeEgfRollup(userId);

delete roll.project.rules.frozen;

//////

//easiest to do from browser console (permissinos issues)

const fileName = '/tmp/egf_project.json';
fs.writeFile(fileName, JSON.stringify(roll));

console.log('\nin terminal:');
console.log(`cat ${fileName} | pbcopy`);
console.log('\nin browser:');
console.log('var project = JSON.stringify(<paste project>, null)');
console.log(`fetch('/data/projects/${roll.project.id}', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: project }); `);


//console.log(`open ${base}/projects/${roll.project.id}`);