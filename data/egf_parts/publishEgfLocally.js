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

//script to run in local dev setup, so the EGF project is published by default in the commons
// 1) write all the sequence files -- requires persistence is set up
// 2) write the project and publish it -- requires server to be running

import path from 'path';
import uuid from 'uuid';
import colors from 'colors/safe';
import makeEgfRollup from './index';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as projects from '../../server/data/persistence/projects';
import * as commons from '../../server/data/persistence/commons';
import * as sequencePersistence from '../../server/data/persistence/sequence';
import * as userHandlers from '../../server/user/updateUserHandler';

const user = {
  uuid: uuid.v1(),
  email: 'egf-software@ed.ac.uk',
  password: 'wahoo123',
  firstName: 'Edinburgh',
  lastName: 'Genome Foundry',
};

const roll = makeEgfRollup(user.uuid);

async function publishEgfLocally() {
  try {
    const pathSequences = path.resolve(__dirname, './sequences');
    console.log(colors.blue(`Copying EGF sequences to storage, from ${pathSequences}`));

    await fileSystem.directoryContents(pathSequences)
    .then(sequenceFiles => sequenceFiles.map((fileName) => {
      const filePath = path.resolve(pathSequences, fileName);
      return fileSystem.fileRead(filePath, false)
      .then(contents => sequencePersistence.sequenceWrite(fileName, contents));
    }))
    .then((sequences) => {
      console.log(`copied ${sequences.length} sequences`);
    })
    .catch((err) => {
      console.log('Error copying EGF sequences, continuing anyway...');
      console.log(err.stack);
    });

    console.log(colors.blue('Creating mock EGF user....'));
    const mappedUser = userHandlers.transformUserForRegistration(user);
    await fetch(userHandlers.authRegisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mappedUser),
    });

    //todo - get user id from registration + assert works in local (with mock id)
    //todo - dont mutate local user (update local auth)

    console.log(colors.blue('Publishing project...'));
    await projects.projectWrite(roll.project.id, roll, user.uuid);
    await commons.commonsPublishVersion(roll.project.id, user.uuid, 0);

    console.log(colors.green('EGF project published'));
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export default publishEgfLocally;
