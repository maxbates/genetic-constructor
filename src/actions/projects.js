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
 * @module Actions_Projects
 * @memberOf module:Actions
 */
import invariant from 'invariant';
import { merge, uniq, values } from 'lodash';
import { push } from 'react-router-redux';

import * as ActionTypes from '../constants/ActionTypes';
import * as blockActions from '../actions/blocks';
import { uiSetGrunt } from '../actions/ui';
import * as blockSelectors from '../selectors/blocks';
import * as projectSelectors from '../selectors/projects';
import { deleteProject, listProjects, loadProject, saveProject } from '../middleware/projects';
import safeValidate from '../schemas/fields/safeValidate';
import * as validators from '../schemas/fields/validators';
import emptyProjectWithConstruct from '../../data/emptyProject/index';
import Project from '../models/Project';
import Rollup from '../models/Rollup';
import { noteSave, noteFailure } from '../store/saveState';
import * as instanceMap from '../store/instanceMap';
import * as undoActions from '../store/undo/actions';
import { getLocal, setLocal } from '../utils/localstorage';
import wrapPausedTransaction from './_wrapPausedTransaction';

/******** constants ********/

const recentProjectKey = 'mostRecentProject';
const saveMessageKey = 'projectSaveMessage';

const projectIdNotDefined = 'projectId is required';
const projectInvalidError = 'Project data is invalid';
const projectNotLoadedError = 'Project has not been loaded';
const projectNotOwnedError = 'User does not own this project'; //todo - unify with server, handle 403 on load

/******** helpers ***********/

const idValidator = id => safeValidate(validators.id(), true, id);

const _getProject = (state, projectId) => {
  invariant(projectId, projectIdNotDefined);
  const project = state.projects[projectId];
  invariant(project, projectNotLoadedError);
  return project;
};

const _getBlock = (state, blockId) => {
  const block = state.blocks[blockId];
  invariant(block, `block ${blockId} not found`);
  return block;
};

const classifyProjectIfNeeded = input => (input instanceof Project) ? input : new Project(input);

/**************************************
 * Actions
 **************************************/

/**
 * Create a project manifest
 * @function
 * @param {Object} [initialModel={}] Data to merge onto scaffold
 * @returns {Project} New project
 */
export const projectCreate = initialModel => (dispatch, getState) => {
  const userId = getState().user.userid;
  const defaultModel = {
    owner: userId,
  };

  const project = new Project(merge(defaultModel, initialModel));
  dispatch({
    type: ActionTypes.PROJECT_CREATE,
    project,
  });

  return project;
};

/**
 * Add projects to the store
 * @function
 * @param projectInput
 * @returns {Project}
 */
export const projectStash = projectInput =>
  (dispatch, getState) => {
    const project = classifyProjectIfNeeded(projectInput);
    dispatch({
      type: ActionTypes.PROJECT_STASH,
      project,
    });
    return project;
  };

/**
 * List manifests of all of a user's projects
 * @function
 * @returns {Promise}
 * @resolve {Array.<Project>}
 * @reject {Response}
 */
export const projectList = () =>
  (dispatch, getState) =>
    listProjects()
    .then((projectManifests) => {
      const projects = projectManifests.map(classifyProjectIfNeeded);

      dispatch({
        type: ActionTypes.PROJECT_LIST,
        projects,
      });

      return projects;
    });

/**
 * Save the project, e.g. for autosave.
 * @function
 * @param {UUID} [inputProjectId] Omit to save the current project
 * @param {boolean} [forceSave=false] Force saving, even if the project has not changed since last save (creates a new version)
 * @returns {Promise}
 * @resolve {number|null} version of save, or null if save was unnecessary
 * @reject {string|Response} Error message
 */
export const projectSave = (inputProjectId, forceSave = false) =>
  (dispatch, getState) => {
    const state = getState();
    const currentProjectId = dispatch(projectSelectors.projectGetCurrentId());
    const projectId = inputProjectId || currentProjectId;

    if (!projectId || !idValidator(projectId)) {
      return Promise.resolve(null);
    }

    try {
      //check if the project + constructs have been loaded, assume project is loaded if they are
      const project = _getProject(state, projectId);
      project.components.every(constructId => _getBlock(state, constructId));
    } catch (err) {
      return Promise.reject(projectNotLoadedError);
    }

    //try to construct rollup... project is not valid if this fails
    let roll;
    try {
      roll = dispatch(projectSelectors.projectCreateRollup(projectId));
    } catch (err) {
      noteFailure(projectId, projectInvalidError);
      return Promise.reject(projectInvalidError);
    }

    // gracefully resolve on save when not owned
    // probably should update our autosaving to be a little smarter
    const userId = state.user.userid;
    if (userId !== roll.getOwner()) {
      return Promise.resolve(null);
    }

    //check if project is new, and save only if it is (or forcing the save)
    if (!instanceMap.isRollupNew(roll) && forceSave !== true) {
      return Promise.resolve(null);
    }

    //ok, initiate the save... save in our save-cache and send to server

    instanceMap.saveRollup(roll);

    return saveProject(projectId, roll)
    .then((versionInfo) => {
      const { version, time } = versionInfo;
      setLocal(recentProjectKey, projectId);

      //if no version => first time saving, show a grunt
      if (!getLocal(saveMessageKey)) {
        dispatch({
          type: ActionTypes.UI_SET_GRUNT,
          gruntMessage: 'Project Saved. Changes will continue to be saved automatically as you work.',
        });
        setLocal(saveMessageKey, true);
      }

      noteSave(projectId, version);

      dispatch({
        type: ActionTypes.PROJECT_SAVE,
        projectId,
        version,
        time,
      });

      return version;
    })
    .catch((err) => {
      noteFailure(projectId, err);
      return Promise.reject(err);
    });
  };

/**
 * Clone a project, and all of its blocks.
 * Cloned project has the correct owner
 * Cloned blocks are automatically assigned the id of the new project
 * @function
 * @param {UUID} projectId Project ID to clone (must be in store)
 * @returns {Project} Cloned project
 * @throws if project not in store, or blocks not in store
 */
export const projectClone = projectId =>
  (dispatch, getState) =>
    wrapPausedTransaction(dispatch, () => {
      const state = getState();
      const userId = state.user.userid;

      const roll = dispatch(projectSelectors.projectCreateRollup(projectId));
      const clone = roll.clone(userId);

      dispatch({
        type: ActionTypes.BLOCK_CLONE,
        blocks: values(clone.blocks),
      });

      dispatch({
        type: ActionTypes.PROJECT_CLONE,
        project: clone.project,
      });

      return clone;
    });

/**
 * Internal method to load a project. Attempt to load another on failure. Used internally by projectLoad, can recursive in this verison.
 * @function
 * @private
 * @param projectId
 * @param userId
 * @param {Array|boolean} [loadMoreOnFail=false] Pass array for list of IDs to ignore
 * @param dispatch Pass in the dispatch function for the store
 * @returns Promise
 * @resolve {Rollup} loaded Project + Block Map
 * @reject
 */
const _projectLoad = (projectId, userId, loadMoreOnFail = false, dispatch) =>
  loadProject(projectId)
  .then(rollup => Rollup.classify(rollup))
  .catch((resp) => {
    if ((resp === null || resp.status === 404) && loadMoreOnFail !== true && !Array.isArray(loadMoreOnFail)) {
      return Promise.reject(resp);
    }

    const ignores = Array.isArray(loadMoreOnFail) ? loadMoreOnFail : [];
    if (typeof projectId === 'string') {
      ignores.push(projectId);
    }

    return dispatch(projectList())
    .then(manifests => manifests
      .filter(manifest => !(ignores.indexOf(manifest.id) >= 0))
      //first sort descending by created date (i.e. if never saved) then descending by saved date (so it takes precedence)
      .sort((one, two) => two.metadata.created - one.metadata.created)
      .sort((one, two) => two.metadata.updated - one.metadata.updated),
    )
    .then((manifests) => {
      if (manifests.length) {
        const nextId = manifests[0].id;
        //recurse, ignoring this projectId
        return _projectLoad(nextId, ignores, dispatch);
      }
      //if no manifests, create a new rollup
      return emptyProjectWithConstruct(userId, true);
    });
  });

/**
 * Load a project and add it and its contents to the store
 * @function
 * @param projectId
 * @param {boolean} [avoidCache=false]
 * @param {Array|boolean} [loadMoreOnFail=false] False to only attempt to load single project ID. Pass array of IDs to ignore in case of failure
 * @returns {Promise}
 * @resolve {Rollup} Returns whole rollup - { project, blocks }
 * @reject null
 */
export const projectLoad = (projectId, avoidCache = false, loadMoreOnFail = false) =>
  (dispatch, getState) => {
    const isCached = !!projectId && instanceMap.projectLoaded(projectId);
    const userId = getState().user.userid;
    const promise = (avoidCache !== true && isCached) ?
      Promise.resolve(instanceMap.getRollup(projectId)) :
      _projectLoad(projectId, userId, loadMoreOnFail, dispatch);

    //rollup by this point has been converted to class instances
    return promise.then((rollup) => {
      instanceMap.saveRollup(rollup);

      return wrapPausedTransaction(dispatch, () => {
        dispatch({
          type: ActionTypes.BLOCK_STASH,
          blocks: values(rollup.blocks),
        });

        dispatch({
          type: ActionTypes.PROJECT_LOAD,
          project: rollup.project,
          rollup,
          userOwnsProject: userId === rollup.project.owner,
        });

        return rollup;
      });
    });
  };

/**
 * Open a project, that has already been loaded using projectLoad()
 * @function
 * @param [inputProjectId] Defaults to most recently saved project
 * @param {boolean} [skipSave=false] By default, save the current project. Skip saving the current project before navigating e.g. if deleting it.
 * @returns {Promise}
 * @resolve {Project} Project that is opened
 * @reject {null}
 */
export const projectOpen = (inputProjectId, skipSave = false) =>
  (dispatch, getState) => {
    const currentProjectId = dispatch(projectSelectors.projectGetCurrentId());
    const projectId = inputProjectId || getLocal(recentProjectKey) || null;
    const projectIdBogus = !currentProjectId || !idValidator(currentProjectId) ||
      currentProjectId === 'null' ||
      currentProjectId === 'undefined';

    //ignore if on a project, and passed the same one
    if (!!currentProjectId && currentProjectId === projectId) {
      return Promise.resolve();
    }

    const promise = (skipSave === true || projectIdBogus)
      ?
      Promise.resolve()
      :
      dispatch(projectSave(currentProjectId))
      .catch((err) => {
        const ignore = projectIdBogus ||
          err === projectNotLoadedError ||
          err === projectNotOwnedError;

        if (!ignore) {
          dispatch({
            type: ActionTypes.UI_SET_GRUNT,
            gruntMessage: `Project ${currentProjectId} couldn't be saved, but navigating anyway...`,
          });
        }
      });

    return promise.then(() => {
      // future - clear the store of blocks from the old project.
      // need to consider blocks in the inventory - loaded projects, search results, shown in onion etc. Probably means committing to using the instanceMap for mapping state to props in inventory.

      //provide a hook for things that want to listen
      dispatch({
        type: ActionTypes.PROJECT_BEFORE_OPEN,
        projectId: currentProjectId,
        nextProjectId: projectId,
      });

      //projectPage will load the project + its blocks (if the user has access)
      //change the route
      //note - if we pass undefined / null its ok, project page will handle. don't send to project/ as currently not a valid route
      dispatch(push(`/project/${projectId}`));

      //dispatch event after the project has been opened
      dispatch({
        type: ActionTypes.PROJECT_OPEN,
        projectId,
      });
      return projectId;
    });
  };

/**
 * Delete a project. THIS CANNOT BE UNDONE.
 *
 * Returns false if project cannot be deleted
 *
 * Recommended usage --- load another project, open it, then call this action
 * @function
 * @param {UUID} projectId
 * @returns {UUID} project ID deleted
 */
export const projectDelete = projectId =>
  (dispatch, getState) => {
    const project = _getProject(getState(), projectId);

    if (project.rules.frozen) {
      dispatch(uiSetGrunt('This is a sample project and cannot be deleted.'));
      return false;
    }

    //todo - no need to wrap in transaction
    //wrap deleting in a transaction
    dispatch(undoActions.transact());

    //optimistically delete the project
    //don't delete the blocks, as they may be shared between projects (or, could delete and then force loading for next / current project)
    dispatch({
      type: ActionTypes.PROJECT_DELETE,
      projectId,
    });

    return deleteProject(projectId)
    //catch deleting a project that is not saved (will 404)
    .catch((resp) => {
      if (resp.status === 404) {
        return null;
      }
      if (resp.status === 405) {
        dispatch(uiSetGrunt('The project cannot be deleted because it is shared in the Public inventory.'));
        return Promise.reject(resp);
      }
      dispatch(undoActions.abort());
      dispatch(uiSetGrunt('There was a problem deleting your project. Please try again.'));
      return Promise.reject(resp);
    })
    .then(() => {
      dispatch(undoActions.commit());
      setLocal(recentProjectKey, null);
      return projectId;
    });
  };

/***************************************
 * Metadata things
 ***************************************/

/**
 * Rename a project
 * @function
 * @param {UUID} projectId
 * @param {string} newName
 * @returns {Project}
 */
export const projectRename = (projectId, newName) =>
  (dispatch, getState) => {
    const oldProject = _getProject(getState(), projectId);
    const project = oldProject.mutate('metadata.name', newName);
    dispatch({
      type: ActionTypes.PROJECT_RENAME,
      undoable: true,
      project,
    });
    return project;
  };

/**
 * Set description of a project
 * @function
 * @param {UUID} projectId
 * @param {string} newDescription
 * @returns {Project}
 */
export const projectSetDescription = (projectId, newDescription) =>
  (dispatch, getState) => {
    const oldProject = _getProject(getState(), projectId);
    const project = oldProject.mutate('metadata.description', newDescription);
    dispatch({
      type: ActionTypes.PROJECT_SET_DESCRIPTION,
      undoable: true,
      project,
    });
    return project;
  };

/**
 * Set the keywords for a project
 * @function
 * @param {UUID} projectId
 * @param {Array<string>} keywords
 * @returns {Project}
 */
export const projectSetKeywords = (projectId, keywords) =>
  (dispatch, getState) => {
    const oldProject = _getProject(getState(), projectId);
    const project = oldProject.mutate('metadata.keywords', keywords);
    dispatch({
      type: ActionTypes.PROJECT_SET_KEYWORDS,
      undoable: true,
      project,
    });
    return project;
  };

/**
 * set the palette for the project
 * @param projectId
 * @param paletteName
 */
export const projectSetPalette = (projectId, paletteName) =>
  (dispatch, getState) => {
    const oldProject = _getProject(getState(), projectId);
    const project = oldProject.mutate('metadata.palette', paletteName);
    dispatch({
      type: ActionTypes.PROJECT_SETPALETTE,
      paletteName,
      undoable: true,
      project,
    });
    return project;
  };

/***************************************
 * Constructs
 ***************************************/

/**
 * Adds a construct to a project. Does not create the construct. Use a Block Action.
 * The added construct should have the project ID of the current project, or pass forceProjectId = true
 * @function
 * @param {UUID} projectId
 * @param {UUID} constructId
 * @param {boolean} [forceProjectId=true] set the projectId if not set
 * @param {number} [index=-1] Where to add construct
 * @returns {Project}
 */
export const projectAddConstruct = (projectId, constructId, forceProjectId = true, index = -1) =>
  (dispatch, getState) =>
    wrapPausedTransaction(dispatch, () => {
      const oldProject = _getProject(getState(), projectId);
      let project;
      if (index < 0) {
        project = oldProject.addComponents(constructId);
      } else {
        project = oldProject.addComponentsAt(index, constructId);
      }

      const component = _getBlock(getState(), constructId);
      const componentProjectId = component.projectId;

      const contents = dispatch(blockSelectors.blockGetContentsRecursive(constructId));
      const contentProjectIds = uniq(values(contents).map(block => block.projectId));

      if (componentProjectId !== projectId || contentProjectIds.some(compProjId => compProjId !== projectId)) {
        //ensure that we are forcing the project ID
        //ensure that Ids are null to ensure we are only adding clones
        invariant(forceProjectId === true && !componentProjectId && contentProjectIds.every(compProjId => !compProjId), 'cannot add component with different projectId! set forceProjectId = true to overwrite.');

        dispatch(blockActions.blockSetProject(constructId, projectId));
      }

      dispatch({
        type: ActionTypes.PROJECT_ADD_CONSTRUCT,
        undoable: true,
        project,
      });

      return project;
    });

/**
 * Removes a construct from a project, and unsets its project ID
 * @function
 * @param {UUID} projectId
 * @param {UUID} constructId
 * @returns {Project}
 */
export const projectRemoveConstruct = (projectId, constructId) =>
  (dispatch, getState) =>
    wrapPausedTransaction(dispatch, () => {
      const oldProject = _getProject(getState(), projectId);
      const component = _getBlock(getState(), constructId);
      const project = oldProject.removeComponents(constructId);

      //unset projectId of construct only, if it is not frozen, otherwise skip it
      if (!component.isFrozen()) {
        dispatch(blockActions.blockSetProject(constructId, null, false));
      }

      dispatch({
        type: ActionTypes.PROJECT_REMOVE_CONSTRUCT,
        undoable: true,
        project,
      });

      return project;
    });

/***************************************
 * Files
 ***************************************/

export const projectFileWrite = (projectId, namespace, fileName, contents) =>
  (dispatch, getState) => {
    const oldProject = _getProject(getState(), projectId);

    return oldProject.fileWrite(namespace, fileName, contents)
    .then((project) => {
      dispatch({
        type: ActionTypes.PROJECT_FILE_WRITE,
        undoable: true,
        project,
      });

      return project;
    });
  };
