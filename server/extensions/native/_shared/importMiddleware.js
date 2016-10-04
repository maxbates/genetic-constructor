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
import formidable from 'formidable';
import invariant from 'invariant';
import md5 from 'md5';

import * as fileSystem from '../../../../server/utils/fileSystem';
import * as filePaths from '../../../../server/utils/filePaths';
import * as persistence from '../../../../server/data/persistence';
import * as rollup from '../../../../server/data/rollup';
import resetColorSeed from '../../../../src/utils/generators/color'; //necessary?

const extensionKey = 'import';

//make storage directory just in case...
fileSystem.directoryMake(filePaths.createStorageUrl(extensionKey));

const createFilePath = (fileName) => {
  invariant(fileName, 'need a file name');
  return filePaths.createStorageUrl(extensionKey, fileName);
};

//todo - NB not yet active. no import router to serve these files. should use hash and include route in the conversion router itseld
const createFileUrl = (fileName) => {
  invariant(fileName, 'need a file name');
  return '/' + extensionKey + '/file/' + fileName;
};

//expects :format and :projectId? on request
export default function importMiddleware(req, res, next) {
  const { format, projectId } = req.params;
  const noSave = req.query.hasOwnProperty('noSave') || projectId === 'convert'; //dont save sequences or project
  const returnRoll = projectId === 'convert'; //return roll at end instead of projectId

  let promise; //resolves to the files in form { name, string, hash, filePath, fileUrl }

  //depending on the type, set variables for file urls etc.
  if (format === 'string') {
    const { name, string, ...rest } = req.body;
    const hash = md5(string);
    const filePath = createFilePath(hash);
    const fileUrl = createFileUrl(hash);

    promise = fileSystem.fileWrite(filePath, string, false)
      .then(() => [{
        name,
        string,
        hash,
        filePath,
        fileUrl,
      }]);
  } else if (format === 'file') {
    // save incoming file then read back the string data.
    // If these files turn out to be large we could modify the import functions to take
    // file names instead but for now, in memory is fine.
    const form = new formidable.IncomingForm();

    promise = new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          return reject(err);
        }
        resolve(files);
      });
    })
      .then(files => {
        //future - actually support multiple files
        return Promise.all(
          [files].map(file => {
            const tempPath = (file && file.data) ? file.data.path : null;

            if (!tempPath) {
              return Promise.reject('no file provided');
            }

            const name = file.data.name;

            return fileSystem.fileRead(tempPath, false)
              .then((string) => {
                const hash = md5(string);
                const filePath = createFilePath(hash);
                const fileUrl = createFileUrl(hash);
                return fileSystem.fileWrite(filePath, string, false)
                  .then(() => ({
                    name,
                    string,
                    hash,
                    filePath,
                    fileUrl,
                  }));
              });
          })
        );
      });
  } else {
    return res.status(404).send('unknown import format, got ' + format + ', expected string or file');
  }

  promise.then(files => {
    Object.assign(req, {
      files,
      format,
      projectId,
      returnRoll,
      noSave,
    });

    resetColorSeed();

    next();
  })
    .catch((err) => {
      console.log('[Import Middleware]', err);
      console.log(err.stack);
      next(err);
    });
}

//expects on req: roll, noSave, returnRoll, :projectId?
//roll can contain project { project } , blocks {blockId : block} , sequences {md5 : seq}  and will be merged / written appropriately
//todo - check permissions on projectId
export function mergeRollupMiddleware(req, res, next) {
  const { projectId, roll, noSave, returnRoll } = req;
  const { project, blocks, sequences = {} } = roll;

  //we write the sequences no matter what right now
  //todo - param to not write sequences (when do we want this?)

  return Promise.all(Object.keys(sequences).map(sequenceMd5 => {
    const sequence = sequences[sequenceMd5];
    return sequence.length > 0 ?
      persistence.sequenceWrite(sequenceMd5, sequence) :
      Promise.resolve();
  }))
    .then(() => {
      if (!projectId || returnRoll) {
        return Promise.resolve({
          project,
          blocks,
        });
      }
      return rollup.getProjectRollup(projectId)
        .then((existingRoll) => {
          existingRoll.project.components = existingRoll.project.components.concat(project.components);
          Object.assign(existingRoll.blocks, blocks);
          return existingRoll;
        });
    })
    .then(roll => {
      if (noSave) {
        return Promise.resolve(roll);
      }

      return rollup.writeProjectRollup(roll.project.id, roll, req.user.uuid)
        .then(() => persistence.projectSave(roll.project.id, req.user.uuid))
        .then(() => roll);
    })
    .then((roll) => {
      const response = returnRoll ?
        roll :
      { projectId: roll.project.id };

      res.status(200).json(response);
    })
    .catch(err => {
      console.log('Error in Merge Rollup Middleware: ' + err);
      console.log(err.stack);
      res.status(500).send(err);
    });
}
