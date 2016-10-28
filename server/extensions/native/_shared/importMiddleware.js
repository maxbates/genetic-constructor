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
import _ from 'lodash';

import * as fileSystem from '../../../../server/utils/fileSystem';
import * as filePaths from '../../../../server/utils/filePaths';
import * as persistence from '../../../../server/data/persistence';
import * as seqPersistence from '../../../../server/data/persistence/sequence';
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

//todo - check permissions on projectId
//expects :projectId (optional) on request
export default function importMiddleware(req, res, next) {
  const { projectId } = req.params;
  const noSave = req.query.hasOwnProperty('noSave') || projectId === 'convert'; //dont save sequences or project
  const returnRoll = projectId === 'convert'; //return roll at end instead of projectId

  let promise; //resolves to the files in form { name, string, hash, filePath, fileUrl }

  //depending on the type, set variables for file urls etc.

  //if we have an object, expect a string to have been passed
  if (typeof req.body === 'object' && !!req.body.string) {
    const { name, string, ...rest } = req.body;
    const hash = md5(string);
    const filePath = createFilePath(hash);
    const fileUrl = createFileUrl(hash);

    //only write the file if it doesnt exist
    promise = fileSystem.fileExists(filePath)
      .catch((err) => fileSystem.fileWrite(filePath, string, false))
      .then(() => [{
        name,
        string,
        hash,
        filePath,
        fileUrl,
      }]);
  } else {
    // otherwise, we are expecting a form

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

                return fileSystem.fileExists(filePath)
                  .catch((err) => fileSystem.fileWrite(filePath, string, false))
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
      })
      .catch((err) => {
        res.status(404).send('error parsing import -- was expecting a file, or JSON object: { name, string }');
        return Promise.reject(err);
      });
  }

  promise.then(files => {
    Object.assign(req, {
      files,
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

/**
 * expects on req: roll, noSave, returnRoll, :projectId?
 *
 * roll can contain project { project } , blocks {blockId : block} , sequences and will be merged / written appropriately
 *
 * sequences can take two forms:
 *
 * todo - deprecate this first format. If anything, should pass in the form { blockId: sequence } and we'll set the md5 etc. extensions should not have to do this hashing
 * POTENTIALLY GOING TO BE DEPRECATED
 * object: assumes blocks already defined properly
 * { md5: sequence }
 *
 * PREFERRED:
 * array: will compute md5 and assign block.sequence.md5, accounting for range
 * [{
 *  sequence: '',
 *  blocks: {
 *    blockId: [start, end] OR true
 *  }
 * }]
 */
export function mergeRollupMiddleware(req, res, next) {
  const { projectId, roll, noSave, returnRoll } = req;
  const { project, blocks, sequences = {} } = roll;

  //we write the sequences no matter what right now
  //todo - param to not write sequences (when do we want this?)

  const writeSequencesPromise = Array.isArray(sequences)
    ?
    Promise.all(
      sequences.map((seqObj) => seqPersistence.sequenceWriteChunks(seqObj.sequence, seqObj.blocks))
    )
      .then(blockMd5Maps => {
        //make simgle object with all blockId : md5 map
        const blockMd5s = Object.assign({}, ...blockMd5Maps);

        //todo - should also assign sequence length here etc.
        _.forEach(blockMd5s, (pseudoMd5, blockId) => {
          //const { hash, hasRange, start, end } = parsePseudoMd5(pseudoMd5);
          _.merge(blocks[blockId], { sequence: {
            md5: pseudoMd5,
            //length: hasRange ? end - start : (GET_FULL_LENGTH)
          } });
        });
      })
    :
    seqPersistence.sequenceWriteMany(sequences);

  return writeSequencesPromise
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
