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
/**
 * Constants for various commit messages + generators so messages are consistent + easier to filter
 * @module commitMessages
 */
const projectSuffix = '_project';
const blockSuffix = '_block';

export const SAVE = 'save';
export const SNAPSHOT = 'snapshot';
export const PROMOTE = 'promote';

export const CREATE = 'create';
export const CREATE_BLOCK = CREATE + blockSuffix;
export const CREATE_PROJECT = CREATE + projectSuffix;

export const COMMIT = 'commit';
export const COMMIT_PROJECT = COMMIT + projectSuffix;
export const COMMIT_BLOCK = COMMIT + blockSuffix;

export const DELETE = 'delete';
export const DELETE_PROJECT = DELETE + projectSuffix;
export const DELETE_BLOCK = DELETE + blockSuffix;

export const SEQUENCE = 'sequence';

//todo - this module requires some testing once we are actually parsing / filtering commit messages

const _createCommitMessage = (type, scope, notes, details) => {
  const header = `${type}(${scope})`;
  const body = !!notes ? `\n\n${notes}` : '';
  const footer = !!details ? `\n\n${details}` : '';
  return header + body + footer;
};

export const parseCommit = (commitMessage) => {
  const regex = /(\w+)\((.+?)\)\[\n]*?(.+)[\n]*?(.+)/i;
  const [ /* match */ , type, scope, notes, details ] = regex.exec(commitMessage);

  //future - when using these, may want to break into type and subtype (e.g. create and commit)
  return {
    type,
    scope,
    notes,
    details,
  };
};

// DEFAULT COMMITS

export const messageProject = (projectId, notes) => {
  return _createCommitMessage(COMMIT_PROJECT, projectId, notes);
};

export const messageBlock = (blockId, notes) => {
  return _createCommitMessage(COMMIT_BLOCK, blockId, notes);
};

// SNAPSHOT

export const messageSave = (projectId, notes) => {
  return _createCommitMessage(SAVE, projectId, notes);
};

export const messageSnapshot = (projectId, notes) => {
  return _createCommitMessage(SNAPSHOT, projectId, notes);
};

// PROMOTE

export const messagePromoteProject = (projectId, sha, notes) => {
  return _createCommitMessage(PROMOTE, projectId, notes, sha);
};

export const messagePromoteBlock = (blockId, sha, notes) => {
  return _createCommitMessage(PROMOTE, blockId, notes, sha);
};

// CREATE

export const messageCreateProject = (projectId) => {
  return _createCommitMessage(CREATE_PROJECT, projectId);
};

export const messageCreateBlock = (blockId) => {
  return _createCommitMessage(CREATE_BLOCK, blockId);
};

// DELETE

export const messageDeleteProject = (projectId) => {
  return _createCommitMessage(DELETE_PROJECT, projectId);
};

export const messageDeleteBlock = (blockId) => {
  return _createCommitMessage(DELETE_BLOCK, blockId);
};

// SEQUENCE

export const messageSequenceUpdate = (blockId, sequence = '') => {
  const length = (!!sequence && typeof sequence === 'string') ? sequence.length : 0;
  return _createCommitMessage(SEQUENCE, blockId, `length=${length}`);
};
