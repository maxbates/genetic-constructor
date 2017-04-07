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
 * @module Actions_Blocks
 * @memberOf module:Actions
 */
import invariant from 'invariant';
import _, { every, filter, values } from 'lodash';

import * as ActionTypes from '../constants/ActionTypes';
import { loadBlock } from '../middleware/projects';
import Block from '../models/Block';
import BlockSchema from '../schemas/Block';
import * as selectors from '../selectors/blocks';
import * as projectSelectors from '../selectors/projects';
import { pauseAction, resumeAction } from '../store/pausableStore';
import * as undoActions from '../store/undo/actions';
import wrapPausedTransaction from './_wrapPausedTransaction';

//hack - so this is super weird - jsdoc will work when you have some statements here. This file needs 1!
const spaceFiller = 10; //eslint-disable-line no-unused-vars

/**** helpers *****/

const _getBlock = (state, blockId) => {
  const block = state.blocks[blockId];
  invariant(block, `block ${blockId} not found`);
  return block;
};

//can use instead of _getBlock to assert existence and ownership
//include detached applies to blocks not in projects and projects without owners
//todo - support multiple blocks
const _assertUserOwnsBlock = (state, blockId, options) => {
  const { includeDetached } = Object.assign({ includeDetached: false }, options);

  const block = _getBlock(state, blockId);
  const projectId = block.projectId;

  //if block detached and thats ok, bail
  if (!projectId || !includeDetached) {
    return block;
  }
  invariant(projectId, `[assertUserOwnsBlock] ${blockId} - detached, cannot look up project owner`);

  const project = state.projects[projectId];
  invariant(project, `[assertUserOwnsBlock] ${blockId} - project ${projectId} not found`);

  const owner = project.owner;
  //if project detached and thats ok, bail
  if (!owner || !includeDetached) {
    return true;
  }

  const userId = state.user.userid;
  invariant(userId, '[assertUserOwnsBlock] user id must be available in store');
  invariant(owner === userId, `[assertUserOwnsBlock] ${blockId} - user does not own project ${projectId} (owner: ${owner})`);
  return true;
};

const _assertBlockNotFixed = block => invariant(!block.isFixed(), 'cannot mutate fixed block');

const _assertBlockIsLeaf = block => invariant(!block.hasContents(), 'block must not have children or list options');

const classifyBlockIfNeeded = input => (input instanceof Block) ? input : new Block(input);

/**************************************
 * ACTIONS
 **************************************/

/**
 * Create a new Block
 * @function
 * @param {Object} initialModel
 * @returns {Block}
 */
export const blockCreate = (initialModel = {}) => (dispatch, getState) => {
  const block = classifyBlockIfNeeded(initialModel);
  dispatch({
    type: ActionTypes.BLOCK_CREATE,
    block,
  });
  return block;
};

/**
 * Add Block Models to the store directly
 * @function
 * @param {...Block|Object} inputBlocks
 * @returns {...Block}
 */
export const blockStash = (...inputBlocks) => (dispatch, getState) => {
  const blocks = inputBlocks.map(classifyBlockIfNeeded);
  dispatch({
    type: ActionTypes.BLOCK_STASH,
    blocks,
  });
  return blocks;
};

/**
 * Clone a block (and its contents - components + list options)
 * Attempts to add ancestor to block.parents (unless parentObjectInput === null), by inspecting block.projectId if present and getting the project from the store, otherwise just clones as copy
 * Sets projectId to null for all cloned elements. Project ID is set when added back to the project.
 * All contents of root block must have the same project ID.
 * @function
 * @param blockInput {ID|Object} JSON of block directly, or ID. Accept both since inventory items may not be in the store, so we need to pass the block directly. Prefer to use ID.
 * @param [parentObjectInput=null] {Object|null} information about parent.
 * if block.projectId === null, defaults to null, and the block is simply cloned, with no ancestry added
 * if block.projectId is set, assigns to defaults:
 *  {id: from block input
 *   projectId - same as block being cloned, or block.projectId
  *  version - that of project ID if in the store, or first parent if available and same project id
  * }
 * @param {Object} [overwriteInput] overwrites to apply to the clones. By default, { projectId: null }
 * @returns {Block} clone block (root node if has children)
 * @throws if block.projectId is defined, but project not in the store, or if components have different projectId
 */
export const blockClone = (blockInput, parentObjectInput, overwriteInput) => (dispatch, getState) => {
  let oldBlock;
  if (typeof blockInput === 'string') {
    oldBlock = getState().blocks[blockInput];
  } else if (BlockSchema.validate(blockInput)) {
    oldBlock = new Block(blockInput);
  } else {
    throw new Error('invalid input to blockClone', blockInput);
  }

  //get the project ID to use for parent, considering the block may be detached from a project or inventory block
  const parentProjectId = oldBlock.projectId || null;
  let parentObject = parentObjectInput || null;

  // if we have a parent projectId, get the project and generate parent information (unless simply copy-cloning)
  // if we dont, nothing really we can do, so just clone without adding lineage
  // NOTE - assumes that project.owner is defined... will error if its not
  if (parentProjectId && parentObjectInput !== null) {
    //note - will throw if project not in store (desired behavior - clone should fail)
    const oldProject = dispatch(projectSelectors.projectGet(parentProjectId));

    // partial object about project
    // block ID handled in block.clone() and changes if dealing with nested blocks
    const parentDefaults = {
      projectId: parentProjectId,
      owner: oldProject.owner,
      version: oldProject.version,
    };

    //assign to the parent, this will account for it being null (and leave it null)
    parentObject = Object.assign(parentDefaults, parentObject);
  }

  //overwrite to set the correct projectId
  const overwriteObject = Object.assign({ projectId: null }, overwriteInput);

  //get all components + list options and clone them
  const contents = values(dispatch(selectors.blockGetContentsRecursive(oldBlock.id)));

  if (contents.length === 0) {
    const block = oldBlock.clone(parentObject, overwriteObject);
    dispatch({
      type: ActionTypes.BLOCK_CLONE,
      block,
    });
    return block;
  }

  const allToClone = [oldBlock, ...contents];

  //all blocks must be from same project (or null), so we can give them the same parent projectId + verion
  //console.log(_.uniqBy(allToClone, 'projectId')); //debugging for line below
  invariant(parentProjectId === null || every(allToClone, block => block.projectId === parentProjectId || !block.projectId), 'project ID must be the same for all blocks (or null)');

  const unmappedClones = allToClone.map(block => block.clone(parentObject, overwriteObject));

  //update IDs in components
  const cloneIdMap = allToClone.reduce((acc, next, index) => {
    acc[next.id] = unmappedClones[index].id;
    return acc;
  }, {});

  const clones = unmappedClones.map((clone) => {
    if (clone.isConstruct()) {
      const newComponents = clone.components.map(componentId => cloneIdMap[componentId]);
      return clone.mutate('components', newComponents);
    }
    if (clone.isList()) {
      const newOptions = Object.keys(clone.options).reduce((acc, oldOption) => Object.assign(acc, {
        [cloneIdMap[oldOption]]: clone.options[oldOption],
      }), {});
      return clone.mutate('options', newOptions);
    }
    return clone;
  });

  dispatch({
    type: ActionTypes.BLOCK_CLONE,
    blocks: clones,
  });

  //return the clone of root passed in
  const rootId = cloneIdMap[oldBlock.id];
  const root = clones.find(clone => clone.id === rootId);
  return root;
};

/**
 * More aggressive version of blockDetach
 * Actually deletes blocks from the store by ID, and removes from all parent blocks containing it
 * @function
 * @param {...UUID} blockIds
 * @returns {...UUID} IDs removed
 */
export const blockDelete = (...blockIds) =>
  (dispatch, getState) =>
    wrapPausedTransaction(dispatch, () => {
      blockIds.forEach((blockId) => {
        //find parent, remove component from parent
        //todo - account for multiple parents (symbolic linking)
        const parent = dispatch(selectors.blockGetParents(blockId)).shift();

        //may not have parent (is construct) or parent was deleted
        if (parent) {
          //todo - remove from options
          dispatch(blockRemoveComponent(parent, blockId)); //eslint-disable-line no-use-before-define
        }

        dispatch({
          type: ActionTypes.BLOCK_DELETE,
          undoable: true,
          blockId,
        });
      });

      return blockIds;
    });

/**
 * Remove blocks from constructs / projects, but leave in the store, and removing block from constructs containing it
 * @function
 * @param {...UUID} blockIds
 * @returns {...UUID} IDs removed
 */
export const blockDetach = (...blockIds) =>
  (dispatch, getState) =>
    wrapPausedTransaction(dispatch, () => {
      blockIds.forEach((blockId) => {
        //find parent, remove component from parent
        //todo - account for multiple parents (symbolic linking)
        const parent = dispatch(selectors.blockGetParents(blockId)).shift();
        //may not have parent (is construct) or parent was deleted
        if (parent) {
          //todo - remove from options
          dispatch(blockRemoveComponent(parent.id, blockId)); //eslint-disable-line no-use-before-define
        }
      });

      return blockIds;
    });

/***************************************
 * Metadata things
 ***************************************/

/**
 * Set the projectId of a detached block (has no projectId), and optionally all of its contents.
 * While the block is in the project, do not set the projectId to something other than the current project! Save errors etc. will happen.
 * @param {UUID} blockId
 * @param {UUID} projectId
 * @param [deep=true]
 * @returns block with blockId
 */
export const blockSetProject = (blockId, projectId, deep = true) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  const contents = dispatch(selectors.blockGetContentsRecursive(blockId));

  invariant(!projectId || !oldBlock.projectId || oldBlock.projectId === projectId, 'block cannot have a different project ID - unset it first');

  const toSet = deep ? [oldBlock, ...values(contents)] : [oldBlock];
  const blocks = toSet.map(block => block.setProjectId(projectId));

  dispatch({
    type: ActionTypes.BLOCK_SET_PROJECT,
    undoable: true, //undoable so that when you remove / undo a block, resets projectId
    blocks,
  });

  return blocks[0];
};

/**
 * Rename a block
 * @function
 * @param {UUID} blockId
 * @param {string} name
 * @returns {Block} Updated Block
 */
export const blockRename = (blockId, name) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  if (oldBlock.metadata.name === name) {
    return oldBlock;
  }

  const block = oldBlock.setName(name);
  dispatch({
    type: ActionTypes.BLOCK_RENAME,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Rename a block
 * @function
 * @param {UUID} blockId
 * @param {string} description
 * @returns {Block} Updated Block
 */
export const blockSetDescription = (blockId, description) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  if (oldBlock.metadata.description === description) {
    return oldBlock;
  }

  const block = oldBlock.mutate('metadata.description', description);
  dispatch({
    type: ActionTypes.BLOCK_SET_DESCRIPTION,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Set block's color
 * @function
 * @param {UUID} blockId
 * @param {string} color Hex color string
 * @returns {Block} Updated Block
 */
export const blockSetColor = (blockId, color) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  if (oldBlock.metadata.color === color) {
    return oldBlock;
  }

  const block = oldBlock.setColor(color);
  dispatch({
    type: ActionTypes.BLOCK_SET_COLOR,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Set block's role
 * @function
 * @param {UUID} blockId
 * @param {string} role Role as defined in {@link module:roles}
 * @returns {Block} Updated Block
 */
export const blockSetRole = (blockId, role) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const oldRole = oldBlock.rules.role;

  if (oldRole === role) {
    return oldBlock;
  }

  const block = oldBlock.setRole(role);
  dispatch({
    type: ActionTypes.BLOCK_SET_ROLE,
    undoable: true,
    oldRole,
    block,
  });
  return block;
};

export const blockSetPalette = (blockId, palette) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  //not construct if detached, or if not in project components
  const project = getState().projects[oldBlock.projectId];
  invariant(!oldBlock.projectId || project, 'if block has projectId, project must be loaded');

  const isConstruct = !oldBlock.projectId || project.components.indexOf(blockId) >= 0;
  invariant(isConstruct, 'can only set palette of a construct (toplevel block)');

  const oldPalette = oldBlock.metadata.palette;

  if (oldPalette === palette) {
    return oldBlock;
  }

  const block = oldBlock.setPalette(palette);
  dispatch({
    type: ActionTypes.BLOCK_SET_PALETTE,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Add users attribution to a block
 * If the last attribution was the users, update the last attribution
 * If pass null for text, remove the attribution if it is the user's
 *
 * defaults: { owner: userId, text: userName, time: Date.now() }
 * @param {UUID} blockId
 * @param {String|null} text
 */
export const blockAttribute = (blockId, text) =>
  (dispatch, getState) => {
    const oldBlock = _getBlock(getState(), blockId);
    _assertBlockNotFixed(oldBlock);

    const userId = getState().user.userid;

    const attribution = text === null ?
      null :
      { owner: userId, text, time: Date.now() };

    const block = oldBlock.attribute(attribution, userId);
    dispatch({
      type: ActionTypes.BLOCK_ATTRIBUTE,
      undoable: true,
      block,
    });
    return block;
  };

/***************************************
 * Rules
 ***************************************/

/**
 * Freeze a block, so that no further changes can be made to it without cloning it first. By default, recursive.
 * @function
 * @param {UUID} blockId
 * @param {boolean} [recursive=true] Apply to contents (components + options)
 * @returns {...Block} all blocks frozen
 */
export const blockFreeze = (blockId, recursive = true) => (dispatch, getState) => {
  const oldBlocks = [getState().blocks[blockId]];
  if (recursive === true) {
    oldBlocks.push(...values(dispatch(selectors.blockGetContentsRecursive(blockId))));
  }

  const blocks = oldBlocks.map(block => block.setFrozen(true));

  dispatch({
    type: ActionTypes.BLOCK_FREEZE,
    undoable: true,
    blocks,
  });

  return blocks;
};

//todo - doc
export const blockSetFixed = (blockId, isFixed = true) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertUserOwnsBlock(getState(), blockId);
  //invariant(dispatch(selectors.blockIsTopLevelConstruct(blockId)), 'construct must be direct child of project');

  const block = oldBlock.setFixed(isFixed);
  dispatch({
    type: ActionTypes.BLOCK_SET_FIXED,
    undoable: true,
    isFixed,
    block,
  });
  return block;
};

//todo - doc
export const blockSetHidden = (blockId, isHidden = true) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.setHidden(isHidden);
  dispatch({
    type: ActionTypes.BLOCK_SET_HIDDEN,
    undoable: true,
    isHidden,
    block,
  });
  return block;
};

//todo - doc
export const blockSetListBlock = (blockId, isList = true) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.setListBlock(isList);
  dispatch({
    type: ActionTypes.BLOCK_SET_LIST,
    undoable: true,
    isList,
    block,
  });
  return block;
};

/***************************************
 * Store + Server Interaction
 ***************************************/

/**
 * Retrieves a block, and its options and components if specified
 * @function
 * @param {UUID} blockId
 * @param {UUID} inputProjectId
 * @param {boolean} [withContents=true]
 * @param {boolean} [skipIfContentsEmpty=false]
 * @returns {Promise} Array of Blocks retrieved
 */
export const blockLoad = (blockId, inputProjectId, withContents = true, skipIfContentsEmpty = false) => (dispatch, getState) => {
  const retrieved = _getBlock(getState(), blockId);
  if (skipIfContentsEmpty === true && retrieved && !retrieved.hasContents()) {
    return Promise.resolve([retrieved]);
  }

  const projectId = inputProjectId || (retrieved ? retrieved.projectId : null);
  invariant(projectId, 'must pass a projectId to blockLoad if block not in store');

  return loadBlock(blockId, projectId, withContents)
  .then(({ components, options }) => {
    const blockMap = Object.assign({}, options, components);
    const blocks = Object.keys(blockMap).map(key => new Block(blockMap[key]));
    dispatch({
      type: ActionTypes.BLOCK_LOAD,
      blocks,
    });
    return blocks;
  });
};

/***************************************
 * Components
 ***************************************/

/**
 * Remove components from a construct
 * @function
 * @param {UUID} constructId
 * @param {...UUID} componentIds
 * @returns {Block} Updated construct
 */
export const blockRemoveComponent = (constructId, ...componentIds) => (dispatch, getState) => {
  const oldBlock = getState().blocks[constructId];
  _assertBlockNotFixed(oldBlock);

  const block = componentIds.reduce((acc, currentId) => acc.removeComponent(currentId), oldBlock);
  dispatch({
    type: ActionTypes.BLOCK_COMPONENT_REMOVE,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Add component to a construct.
 * Removes from previous parent if currently part of a construct
 * Note you may use blockAddComponents to add more than one at a time.
 * @function
 * @param {UUID} blockId Construct
 * @param {UUID} componentId Component
 * @param {number} index to insert component
 * @param {boolean} [forceProjectId=false] set Project ID. Use true if the block is not from this project
 * @returns {Block} Updated construct
 */
export const blockAddComponent = (blockId, componentId, index = -1, forceProjectId = true) => (dispatch, getState) => {
  const oldParent = dispatch(selectors.blockGetParents(componentId)).shift();
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const component = getState().blocks[componentId];

  invariant(!component.isTemplate(), 'cannot add a template as a component');

  const componentProjectId = component.projectId;
  const nextParentProjectId = oldBlock.projectId;

  const contents = dispatch(selectors.blockGetContentsRecursive(componentId));
  const contentProjectIds = _.uniq(values(contents).map(block => block.projectId));

  return wrapPausedTransaction(dispatch, () => {
    //remove component from old parent (should clone first to avoid this, this is to handle just moving)
    //run this before setting projectId, as this unsets it
    if (oldParent) {
      dispatch(blockRemoveComponent(oldParent.id, componentId));
    }

    //verify projectId match, set if appropriate (forceProjectId is true, or not set in component being added)
    if (componentProjectId !== nextParentProjectId || contentProjectIds.some(compProjId => compProjId !== nextParentProjectId)) {
      invariant(forceProjectId === true && !componentProjectId && contentProjectIds.every(compProjId => !compProjId), 'cannot add component with different projectId! set forceProjectId = true to overwrite.');

      if (nextParentProjectId) {
        dispatch(blockSetProject(componentId, nextParentProjectId, true));
      }
    }

    //might have been a top-level construct, just clear top-level fields in case
    const isTopLevel = dispatch(selectors.blockIsTopLevelConstruct(componentId));
    if (isTopLevel) {
      dispatch(blockStash(component.clearToplevelFields()));
    }

    //now update the parent
    const block = oldBlock.addComponent(componentId, index);
    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_ADD,
      undoable: true,
      block,
    });

    return block;
  });
};

/**
 * Add multiple components to a construct at once, calling blockAddComponent
 * @function
 * @param {UUID} blockId Construct
 * @param {Array.<UUID>} componentIds Components
 * @param {number} index to insert component
 * @param {boolean} [forceProjectId=true] Set project ID. Use true if the block is not from this project
 * @returns {Block} Updated construct
 */
export const blockAddComponents = (blockId, componentIds, index, forceProjectId = true) =>
  (dispatch, getState) => {
    const oldBlock = _getBlock(getState(), blockId);
    _assertBlockNotFixed(oldBlock);

    dispatch(pauseAction());
    dispatch(undoActions.transact());

    try {
      componentIds.forEach((componentId, subIndex) => {
        dispatch(blockAddComponent(blockId, componentId, index + subIndex, forceProjectId));
      });
      dispatch(undoActions.commit());
    } catch (err) {
      dispatch(undoActions.abort());
      console.error(err); //eslint-disable-line no-console
    }

    dispatch(resumeAction());

    return componentIds;
  };

/**
 * Move component within a construct
 * @function
 * @param {UUID} blockId
 * @param {UUID} componentId
 * @param {number} newIndex
 * @returns {Block} Updated construct
 */
export const blockMoveComponent = (blockId, componentId, newIndex) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.moveComponent(componentId, newIndex);
  dispatch({
    type: ActionTypes.BLOCK_COMPONENT_MOVE,
    undoable: true,
    block,
  });
  return block;
};

/***************************************
 Options
 ***************************************/

//todo - doc
export const blockOptionsAdd = (blockId, ...optionIds) => (dispatch, getState) => {
  const state = getState();
  const oldBlock = state.blocks[blockId];
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.addOptions(...optionIds);
  const options = optionIds.map(optionId => state.blocks[optionId]);
  const targetProjectId = block.projectId;

  //if target block is in a project, make sure that options being added are valid
  if (targetProjectId) {
    //first, check the options themselves
    invariant(every(options, block => !block.projectId || block.projectId === targetProjectId), 'must pass options which have no projectId, or match match that of block with blockId');

    const relevantOptions = filter(options, option => option.projectId !== targetProjectId);
    const optionsWithId = relevantOptions.map(rel => rel.setProjectId(targetProjectId));

    //now, check the contents as well

    const contents = optionIds
    .map(optionId => dispatch(selectors.blockGetContentsRecursive(optionId)))
    .reduce((one, two) => Object.assign(one, two), {});
    const numberContents = Object.keys(contents).length;

    if (numberContents > 1) {
      invariant(every(contents, block => !block.projectId || block.projectId === targetProjectId), 'contents of all options must have no projectId, or match match that of block with blockId');

      //assign blocks without projectId
      const relevantContents = filter(contents, content => content.projectId !== targetProjectId);
      const blocksWithId = relevantContents.map(rel => rel.setProjectId(targetProjectId));

      optionsWithId.push(...blocksWithId);
    }

    dispatch({
      type: ActionTypes.BLOCK_SET_PROJECT,
      blocks: optionsWithId,
    });
  }

  dispatch({
    type: ActionTypes.BLOCK_OPTION_ADD,
    undoable: true,
    block,
  });
  return block;
};

//todo - doc
export const blockOptionsRemove = (blockId, ...optionIds) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.removeOptions(...optionIds);
  dispatch({
    type: ActionTypes.BLOCK_OPTION_REMOVE,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Toggle whether a list option is active
 * @function
 * @param blockId
 * @param optionIds
 * @returns {function(*, *)}
 */
export const blockOptionsToggle = (blockId, ...optionIds) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);

  const block = oldBlock.toggleOptions(...optionIds);
  dispatch({
    type: ActionTypes.BLOCK_OPTION_TOGGLE,
    undoable: true,
    block,
  });
  return block;
};

/***************************************
 * annotations
 ***************************************/

/**
 * Add an annotation to a block
 * @function
 * @param {UUID} blockId
 * @param {Annotation} annotation
 * @returns {Block} Updated Block
 */
export const blockAnnotate = (blockId, annotation) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.annotate(annotation);
  dispatch({
    type: ActionTypes.BLOCK_ANNOTATE,
    undoable: true,
    block,
  });
  return block;
};

/**
 * Remove an annotation
 * @function
 * @param {UUID} blockId
 * @param {Annotation|string} annotation Annotation or its name
 * @returns {Block} Updated Block
 */
export const blockRemoveAnnotation = (blockId, annotation) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.removeAnnotation(annotation);
  dispatch({
    type: ActionTypes.BLOCK_REMOVE_ANNOTATION,
    undoable: true,
    block,
  });
  return block;
};

/***************************************
 * Sequence
 ***************************************/

/**
 * Download a Block's sequence
 * @function
 * @param {UUID} blockId Block ID with sequence to retrieve
 * @returns {Promise} Resolves to plain string of sequence
 */
export const blockGetSequence = blockId => (dispatch, getState) => {
  const block = _getBlock(getState(), blockId);
  _assertBlockIsLeaf(block);
  return block.getSequence();
};

/**
 * Set a block's sequence, updating its source and sequence metadata
 * @function
 * @param {UUID} blockId
 * @param {string} sequence Sequence string
 * @param {boolean} [useStrict] Use strict sequence validation (canonical IUPAC bases)
 * @returns {Promise} resolves to Block when the sequence has been written
 */
export const blockSetSequence = (blockId, sequence, useStrict) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);
  _assertBlockIsLeaf(oldBlock);

  return oldBlock.setSequence(sequence, useStrict)
  .then((block) => {
    dispatch({
      type: ActionTypes.BLOCK_SET_SEQUENCE,
      undoable: true,
      block,
    });
    return block;
  });
};

/**
 * Set trim of a block's sequence, i.e. how many bases at start and end to skip when viewing
 * @function
 * @param {UUID} blockId
 * @param {number} start bases from start to skip
 * @param {number} end bases from end to ignore
 * @returns {Block}
 */
export const blockTrimSequence = (blockId, start = 0, end = 0) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.setSequenceTrim(start, end);
  dispatch({
    type: ActionTypes.BLOCK_SET_TRIM,
    undoable: true,
    block,
  });
  return block;
};

/***************************************
 * Jobs
 ***************************************/

export const blockSetJobId = (blockId, jobId) => (dispatch, getState) => {
  const oldBlock = _getBlock(getState(), blockId);
  _assertBlockNotFixed(oldBlock);

  const block = oldBlock.setJobId(jobId);
  dispatch({
    type: ActionTypes.BLOCK_SET_JOB_ID,
    undoable: true,
    block,
  });
  return block;
};
