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
 * @module Selectors_Projects
 * @memberOf module:Selectors
 */
import invariant from 'invariant';
import _ from 'lodash';

import * as projectFilesApi from '../middleware/projectFiles';
import Rollup from '../models/Rollup';
import * as blockSelectors from './blocks';

const projectIdNotDefined = 'projectId is required';
const projectNotLoadedError = 'Project has not been loaded';

const _getCurrentProjectId = () => {
  const match = /^\/project\/(.*?)\??$/gi.exec(window.location.pathname);
  return match ? match[1] : null;
};

const _getProjectFromStore = (projectId, store) => {
  invariant(projectId, projectIdNotDefined);
  const project = store.projects[projectId];
  invariant(project, projectNotLoadedError);
  return project;
};

/**
 * Get a project by ID
 * @function
 * @param {UUID} projectId
 * @returns {Project}
 */
export const projectGet = projectId => (dispatch, getState) => _getProjectFromStore(projectId, getState());

/**
 * Get current project ID, from the URL
 * @function
 * @returns {UUID} current project ID
 */
export const projectGetCurrentId = () => (dispatch, getState) => _getCurrentProjectId();

/**
 * Get current project version
 * @function
 * @param {UUID} projectId
 * @returns {number} latest project version
 */
export const projectGetVersion = projectId => (dispatch, getState) => {
  const project = _getProjectFromStore(projectId, getState());
  return project ? project.version : null;
};

/**
 * Get all components of a project (does not include list block options, just list blocks). See projectListAllBlocks()
 * todo - move to object
 * @function
 * @param {UUID} projectId
 * @returns {UUID} current project ID
 */
export const projectListAllComponents = projectId => (dispatch, getState) => {
  const project = _getProjectFromStore(projectId, getState());

  return project.components.reduce((acc, componentId) => {
    acc.push(dispatch(blockSelectors.blockGet(componentId)));
    const constructChildren = dispatch(blockSelectors.blockGetComponentsRecursive(componentId));
    acc.push(...constructChildren);
    return acc;
  }, []);
};

/**
 * Get all list options of a project.
 * todo - move to object
 * @function
 * @param {UUID} projectId
 * @returns {Array<Block>}
 */
export const projectListAllOptions = projectId => (dispatch, getState) => {
  const components = dispatch(projectListAllComponents(projectId));
  const optionIds = components.reduce((acc, comp) => acc.concat(Object.keys(comp.options)), []);
  return optionIds.map(id => dispatch(blockSelectors.blockGet(id)));
};

/**
 * Get all contents of a project.
 * Prunes to the blocks actually in the project, not just blocks with correct projectId
 * todo - move to object
 * @function
 * @param {UUID} projectId
 * @returns {Array<Block>}
 */
export const projectListAllBlocks = projectId => (dispatch, getState) => {
  const components = dispatch(projectListAllComponents(projectId));
  const options = dispatch(projectListAllOptions(projectId));
  return components.concat(options);
};

/**
 * Create project rollup
 * @function
 * @param {UUID} projectId
 * @returns {Object} { project: Project, blocks: Object.<blockId:Block> }
 */
export const projectCreateRollup = projectId => (dispatch, getState) => {
  const project = _getProjectFromStore(projectId, getState());
  const blocks = _.keyBy(dispatch(projectListAllBlocks(projectId)), 'id');

  return new Rollup({
    project,
    blocks,
  });
};

// PROJECT FILES

/**
 * Read a project file
 * @function
 * @param {UUID} projectId
 * @param {String} namespace Namespace
 * @param {String} fileName Name of File
 * @param {String} [format='text']
 * @param {String} [version] Default is return latest, or specify a specific version
 */
export const projectFileRead = (projectId, namespace, fileName, format, version) => (dispatch, getState) => {
  const oldProject = getState().projects[projectId];

  return oldProject.fileRead(namespace, fileName, format, version);
};

/**
 * List files associated with a specific namespace
 * @function
 * @param {UUID} projectId
 * @param {String} namespace
 */
export const projectFileList = (projectId, namespace) =>
  (dispatch, getState) =>
  projectFilesApi.projectFileList(projectId, namespace);

