import path from 'path';
import invariant from 'invariant';
import _, { merge, cloneDeep } from 'lodash';
import uuid from 'node-uuid';
import { fork } from 'child_process';

import * as fileSystem from '../../../data/middleware/fileSystem';
import * as sequences from '../../../data/persistence/sequence';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import Annotation from '../../../../src/models/Annotation';

import DebugTimer from '../../../utils/DebugTimer';
const timer = new DebugTimer('Genbank', { delayed: true });

//////////////////////////////////////////////////////////////
// COMMON
//////////////////////////////////////////////////////////////
const createTempFilePath = () => `/tmp/${uuid.v4()}`;

//todo - will need to consider bundling
//one process for each
const importFork = fork(`${__dirname}/convertChild.js`, { cwd: __dirname });
const exportFork = fork(`${__dirname}/convertChild.js`, { cwd: __dirname });

process.on('exit', () => {
  importFork.kill('SIGHUP');
  exportFork.kill('SIGHUP');
});

// Run an external command and return the data in the specified output file
//commmand is 'import' or 'export'
const runCommand = (command, inputFile, outputFile) => {
  const fork = command === 'import' ? importFork : exportFork;

  return new Promise((resolve, reject) => {
    const procId = uuid.v4();
    timer.time('starting fork ' + procId);

    fork.send({ type: command, id: procId, input: inputFile, output: outputFile });

    fork.on('message', (message) => {
      if (procId === message.id) {
        timer.time('fork completed ' + procId);
        //console.log('proc completed', message);

        if (message.success) {
          return resolve(message.result);
        }
        return reject(message.error);
      }
    });
  })
    .then(() => fileSystem.fileRead(outputFile, false));

  /*
   return new Promise((resolve, reject) => {
   exec(command, (err, stdout) => {
   if (err) {
   console.log('ERROR!!!!!');
   console.log(err);
   return reject(err);
   }
   return resolve(stdout);
   });
   })
   .then(() => fileSystem.fileRead(outputFile, false));
   */
};

//////////////////////////////////////////////////////////////
// IMPORT
//////////////////////////////////////////////////////////////
// Create a GD block given a structure coming from Python
//assigns the sequence to a custom field
const createBlockStructure = (block, sourceId) => {
  // generate a valid block scaffold. This is similar to calling new Block(),
  // but a bit more light weight and easier to work with (models are frozen so you cannot edit them)
  const fileName = /[^/]*$/.exec(sourceId)[0];

  // Remap annotations
  let allAnnotations = [];
  if (block.sequence.annotations) {
    allAnnotations = block.sequence.annotations.map(ann => {
      return Annotation.classless(ann);
    });
  }

  //reassign values
  const toMerge = {
    metadata: block.metadata,
    sequence: {
      length: block.sequence.length,
      annotations: allAnnotations,
    },
    source: {
      id: fileName,
      source: 'genbank',
    },
    rules: block.rules,
  };

  //be sure to pass in empty project first, so you arent overwriting scaffold each time
  const outputBlock = Block.classless(toMerge);

  //return promise which will resolve with block once done
  return {
    block: outputBlock,
    id: outputBlock.id,
    oldId: block.id,
    children: block.components,
  };
};

// Creates a structure of GD blocks given the structure coming from Python
//and save sequences
const createAllBlocks = (outputBlocks, sourceId) => {
  return _.map(outputBlocks, (block) => createBlockStructure(block, sourceId));
};

// Takes a block structure and sets up the hierarchy through GD ids.
// This is necessary because Python returns ids that are not produced by GD.
// takes block structure (block, id, oldId, children) and returns blocks with proper IDs
const remapHierarchy = (blockArray, idMap) => {
  return _.map(blockArray, (structure) => {
    const newBlock = structure.block;
    newBlock.components = structure.children.map(oldId => idMap[oldId]);
    return newBlock;
  });
};

// Converts an input project structure (from Python) into GD format
const handleProject = (outputProject, rootBlockIds) => {
  //just get fields we want using destructuring and use them to merge
  const { name, description } = outputProject;

  return Project.classless({
    components: rootBlockIds,
    metadata: {
      name,
      description,
    },
  });
};

// Reads a genbank file and returns a project structure and all the blocks
// These return structures are NOT in GD format.
const readGenbankFile = (inputFilePath) => {
  const outputFilePath = createTempFilePath();

  timer.time('starting conversion');

  return runCommand('import', inputFilePath, outputFilePath)
    .then(resStr => {
      timer.time('ran python');

      if (!process.env.DEBUG) {
        fileSystem.fileDelete(outputFilePath);
      }

      try {
        const res = JSON.parse(resStr);
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    })
    .catch(err => {
      console.log('ERROR IN PYTHON');
      console.log(err);
      if (!process.env.DEBUG) {
        fileSystem.fileDelete(outputFilePath);
      }
      return Promise.reject(err);
    });
};

// Creates a rough project structure (not in GD format yet!) and a list of blocks from a genbank file
const handleBlocks = (inputFilePath) => {
  return readGenbankFile(inputFilePath)
    .then(result => {
      timer.time('file read');

      if (result && result.project && result.blocks &&
        result.project.components && result.project.components.length > 0) {
        const blocksWithOldIds = createAllBlocks(result.blocks, inputFilePath);
        timer.time('blocks created');

        const idMap = _.zipObject(
          _.map(blocksWithOldIds, 'oldId'),
          _.map(blocksWithOldIds, 'id')
        );

        const remappedBlocksArray = remapHierarchy(blocksWithOldIds, idMap);
        const newRootBlocks = result.project.components.map((oldBlockId) => idMap[oldBlockId]);
        const blockMap = remappedBlocksArray.reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
        const newSequences = result.sequences.map((sequence) => ({
          sequence: sequence.sequence,
          blocks: _.mapKeys(sequence.blocks, (value, oldId) => idMap[oldId]),
        }));

        timer.time('blocks remapped');

        return { project: result.project, rootBlocks: newRootBlocks, blocks: blockMap, sequences: newSequences };
      }
      return 'Invalid Genbank format.';
    });
};

// Import project and construct/s from genbank
// Returns a project structure and the list of all blocks
export const importProject = (inputFilePath) => {
  timer.start('start');

  return handleBlocks(inputFilePath)
    .then((result) => {
      timer.time('blocks handled');

      if (_.isString(result)) {
        return result;
      }
      const resProject = handleProject(result.project, result.rootBlocks);

      timer.log();
      timer.clear();

      //const outputFile = filePaths.createStorageUrl('imported_from_genbank.json');
      //fileSystem.fileWrite(outputFile, {project: resProject, blocks: result.blocks});
      return { project: resProject, blocks: result.blocks, sequences: result.sequences };
    });
};

// Import only construct/s from genbank
// Returns a list of block ids that represent the constructs, and the list of all blocks
export const importConstruct = (inputFilePath) => {
  return handleBlocks(inputFilePath)
    .then((rawProjectRootsAndBlocks) => {
      if (_.isString(rawProjectRootsAndBlocks)) {
        return rawProjectRootsAndBlocks;
      }
      return {
        roots: rawProjectRootsAndBlocks.rootBlocks,
        blocks: rawProjectRootsAndBlocks.blocks,
        sequences: rawProjectRootsAndBlocks.sequences,
      };
    });
};

//given a genbank file, converts it, returning an object with the form {roots: <ids>, blocks: <blocks>}
//this handles saving sequences
export const convert = (inputFilePath) => {
  return importConstruct(inputFilePath);
};

//////////////////////////////////////////////////////////////
// EXPORT
//////////////////////////////////////////////////////////////
// Call Python to generate the genbank output for a project with a set of blocks
const exportProjectStructure = (project, blocks) => {
  invariant(Array.isArray(blocks), 'this function expects blocks to be an array');

  const inputFilePath = createTempFilePath();
  const outputFilePath = createTempFilePath();
  const input = {
    project,
    blocks,
  };

  //const outputFile2 = filePaths.createStorageUrl('exported_to_genbank.json');
  //fileSystem.fileWrite(outputFile2, input);
  //console.log(JSON.stringify(input));

  return fileSystem.fileWrite(inputFilePath, input)
    .then(() => runCommand('export', inputFilePath, outputFilePath))
    .then(resStr => {
      if (!process.env.DEBUG) {
        fileSystem.fileDelete(inputFilePath);
      }
      return outputFilePath;
    })
    .catch(err => {
      //dont need to wait for promises to resolve
      if (!process.env.DEBUG) {
        fileSystem.fileDelete(inputFilePath);
        fileSystem.fileDelete(outputFilePath);
      }
      console.log('ERROR IN PYTHON');
      console.log('Command');
      console.log(`python ${path.resolve(__dirname, 'convert.py')} to_genbank ${inputFilePath} ${outputFilePath}`);
      console.log('Error');
      console.log(err);
      return Promise.reject(err);
    });
};

// Load sequences from their MD5 in a set of block structures
//expects an object in the format { block.id : block }
const loadSequences = (blockMap) => {
  invariant(typeof blockMap === 'object', 'passed rollup should be a block map');

  return sequences.sequenceGetMany(_.mapValues(blockMap, block => block.sequence.md5))
    .then(sequences => {
      console.log(sequences);
      _.forEach(sequences, (sequence, blockId) => {
        blockMap[blockId].sequence.sequence = sequence;
      });
      return _.values(blockMap);
    });
};

// This is the entry function for project export
// Given a project and a set of blocks, generate the genbank format
export const exportProject = (roll) => {
  return loadSequences(roll.blocks)
    .then((blockWithSequences) => exportProjectStructure(roll.project, blockWithSequences))
    .then((exportStr) => Promise.resolve(exportStr));
};

// This is the entry function for construct export
// Given a project and a set of blocks, generate the genbank format for a particular construct within that project
//expects input in form: { roll: <rollup> : constructId: <UUID> }
export const exportConstruct = (input) => {
  return loadSequences(input.roll.blocks)
    .then(blockWithSequences => {
      const theRoll = merge(cloneDeep(input.roll), { project: { components: [input.constructId] } });
      // Rewrite the components so that it's only the requested construct!
      return exportProjectStructure(theRoll.project, blockWithSequences)
        .then(exportStr => Promise.resolve(exportStr))
        .catch(err => Promise.reject(err));
    });
};
