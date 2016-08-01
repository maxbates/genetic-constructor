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
 * @module Block Actions
 * @memberOf module:Actions
 */
import invariant from 'invariant';
import { merge } from 'lodash';
import * as ActionTypes from '../constants/ActionTypes';
import BlockSchema from '../schemas/Block';
import Block from '../models/Block';
import { loadBlock } from '../middleware/data';
import * as selectors from '../selectors/blocks';
import * as projectSelectors from '../selectors/projects';
import * as undoActions from '../store/undo/actions';
import { pauseAction, resumeAction } from '../store/pausableStore';

//todo - helper to wrap dispatch()'s in a paused transaction - make sure dispatch still runs when passed as arg

/**
 * Retrieves a block, and its options and components if specified
 * @param {UUID} blockId
 * @param {UUID} inputProjectId
 * @param {boolean} [withContents=false]
 * @param {boolean} [skipIfContentsEmpty=false]
 * @returns {Promise} Array of Blocks retrieved
 */
export const blockLoad = (blockId, inputProjectId, withContents = false, skipIfContentsEmpty = false) => {
  return (dispatch, getState) => {
    const retrieved = getState().blocks[blockId];
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
};

/**
 * Create a new Block
 * @param {Object} initialModel
 * @param {boolean} [useDefaults=true] Set e.g. current project ID automatically. Set to false if you are creating a block outside of a project (i.e. floating, not associated with project yet)
 * @returns {Block}
 */
export const blockCreate = (initialModel, useDefaults = true) => {
  return (dispatch, getState) => {
    const toMerge = (useDefaults === true) ?
    { projectId: dispatch(projectSelectors.projectGetCurrentId()) } :
    {};

    const block = new Block(merge(toMerge, initialModel));
    dispatch({
      type: ActionTypes.BLOCK_CREATE,
      block,
    });
    return block;
  };
};

/**
 * Add Block Models to the store directly
 * @param {...Block|Object} inputBlocks
 * @returns {...Block}
 */
export const blockStash = (...inputBlocks) => {
  return (dispatch, getState) => {
    const blocks = inputBlocks.map(blockObj => new Block(blockObj));
    dispatch({
      type: ActionTypes.BLOCK_STASH,
      blocks,
    });
    return blocks;
  };
};

//this is a backup for performing arbitrary mutations. You probably shouldn't use this.
export const blockMerge = (blockId, toMerge) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.merge(toMerge);
    dispatch({
      type: ActionTypes.BLOCK_MERGE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Clone a block (and its children, by default)
 *
 * @param blockInput {ID|Object} JSON of block directly, or ID. Accept both since inventory items may not be in the store, so we need to pass the block directly. Prefer to use ID.
 * @param parentObjectInput {Object} information about parent, defaults to generated:
 *  {id: from block input
 *   projectId - same as block being cloned, or block.projectId
  *  version - that of project ID if in the store, or first parent if available and same project id
  * }
 * @param shallowOnly {Boolean} Does a deep clone by default, adds all child blocks to store
 * @returns {Block} clone block (root node if has children)
 */
export const blockClone = (blockInput, parentObjectInput = {}, shallowOnly = false) => {
  return (dispatch, getState) => {
    let oldBlock;
    if (typeof blockInput === 'string') {
      oldBlock = getState().blocks[blockInput];
    } else if (BlockSchema.validate(blockInput)) {
      oldBlock = new Block(blockInput);
    } else {
      throw new Error('invalid input to blockClone', blockInput);
    }

    //note - Block.options
    // we dont need to do anything in cloning for block.options, since these are just copied over from project to project
    // the assumption is that options will be fetched and stashed (not cloned) in the project as needed, but separate from cloning.
    // this is so the option IDs remain consistent, and projects are not huge with duplicate blocks that are just options (since they are static)
    // NB - this is reliant on the expectation that the whole project has been loaded and all the list options are in the store
    // this assumption is valid so long as the project is loaded when browsing templates

    //get the project ID to use for parent, considering the block may be detached from a project (e.g. inventory block)
    const parentProjectId = oldBlock.projectId || null;
    //will default to null if parentProjectId is undefined
    const parentProjectVersion = dispatch(projectSelectors.projectGetVersion(parentProjectId));

    //partial object about project, block ID handled in block.clone()
    const parentObject = Object.assign({
      projectId: parentProjectId,
      version: parentProjectVersion,
    }, parentObjectInput);

    if (!!shallowOnly || !oldBlock.components.length) {
      const block = oldBlock.clone(parentObject);
      dispatch({
        type: ActionTypes.BLOCK_CLONE,
        block,
      });
      return block;
    }

    const allChildren = dispatch(selectors.blockGetComponentsRecursive(oldBlock.id));
    const allToClone = [oldBlock, ...allChildren];
    //all blocks must be from same project, and all were from given version
    const unmappedClones = allToClone.map(block => block.clone(parentObject));

    //update IDs in components
    const cloneIdMap = allToClone.reduce((acc, next, index) => {
      acc[next.id] = unmappedClones[index].id;
      return acc;
    }, {});
    const clones = unmappedClones.map(clone => {
      if (!clone.isConstruct()) {
        return clone;
      }
      const newComponents = clone.components.map(componentId => cloneIdMap[componentId]);
      return clone.mutate('components', newComponents);
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
};

/**
 * Freeze a block, so that no further changes can be made to it without cloning it first
 * @param {UUID} blockId
 * @param {boolean} [recursive=true] Apply to contents (components + options)
 * @returns {...Block} all blocks frozen
 */
export const blockFreeze = (blockId, recursive = true) => {
  return (dispatch, getState) => {
    const oldBlocks = [getState().blocks[blockId]];
    if (recursive === true) {
      oldBlocks.push(...dispatch(selectors.blockGetContentsRecursive(blockId)));
    }

    const blocks = oldBlocks.map(block => block.setFrozen(true));

    dispatch({
      type: ActionTypes.BLOCK_FREEZE,
      undoable: true,
      blocks,
    });

    return blocks;
  };
};

/**
 * Deletes blocks from the store by ID, and removes from constructs containing it
 * @param {...UUID} blockIds
 * @returns {...UUID} IDs removed
 */
export const blockDelete = (...blockIds) => {
  return (dispatch, getState) => {
    dispatch(pauseAction());
    dispatch(undoActions.transact());

    blockIds.forEach(blockId => {
      //find parent, remove component from parent

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

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return blockIds;
  };
};

/**
 * Remove blocks from constructs / projects, but leave in the store, and removing block from constructs containing it
 * @param {...UUID} blockIds
 * @returns {...UUID} IDs removed
 */
export const blockDetach = (...blockIds) => {
  return (dispatch, getState) => {
    dispatch(pauseAction());
    dispatch(undoActions.transact());

    blockIds.forEach(blockId => {
      //find parent, remove component from parent
      const parent = dispatch(selectors.blockGetParents(blockId)).shift();
      //may not have parent (is construct) or parent was deleted
      if (parent) {
        //todo - remove from options
        dispatch(blockRemoveComponent(parent.id, blockId)); //eslint-disable-line no-use-before-define
      }
    });

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return blockIds;
  };
};

/***************************************
 * Components
 ***************************************/

/**
 * Remove components from a construct
 * @param {UUID} constructId
 * @param {...UUID} componentIds
 * @returns {Block} Updated construct
 */
export const blockRemoveComponent = (constructId, ...componentIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[constructId];
    const block = componentIds.reduce((acc, currentId) => {
      return acc.removeComponent(currentId);
    }, oldBlock);

    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_REMOVE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Add component to a construct.
 * Removes from previous parent if currently part of a construct
 * Note you may use blockAddComponents to add more than one at a time.
 * @param {UUID} blockId Construct
 * @param {UUID} componentId Component
 * @param {number} index to insert component
 * @param {boolean} [forceProjectId=false] Use true if the block is not from this project
 * @returns {Block} Updated construct
 */
export const blockAddComponent = (blockId, componentId, index = -1, forceProjectId = false) => {
  return (dispatch, getState) => {
    const oldParent = dispatch(selectors.blockGetParents(componentId)).shift();
    const oldBlock = getState().blocks[blockId];
    const component = getState().blocks[componentId];

    const componentProjectId = component.projectId;
    const nextParentProjectId = oldBlock.projectId;

    dispatch(pauseAction());
    dispatch(undoActions.transact());

    //verify projectId match, set if appropriate (forceProjectId is true, or not set in component being added)
    if (componentProjectId !== nextParentProjectId) {
      invariant(!componentProjectId || forceProjectId === true, 'cannot add component with different projectId! set forceProjectId = true to overwrite.');

      //there may be scenarios where we are adding to a detached block, so lets avoid the error when next parent has no project
      if (nextParentProjectId) {
        const updatedComponent = component.setProjectId(nextParentProjectId);
        dispatch({
          type: ActionTypes.BLOCK_STASH,
          block: updatedComponent,
        });
      }
    }

    //remove component from old parent (should clone first to avoid this, this is to handle just moving)
    if (oldParent) {
      dispatch(blockRemoveComponent(oldParent.id, componentId));
    }

    //now update the parent
    const block = oldBlock.addComponent(componentId, index);
    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_ADD,
      undoable: true,
      block,
    });

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return block;
  };
};

/**
 * Add multiple components to a construct at once, calling blockAddComponent
 * @param {UUID} blockId Construct
 * @param {Array.<UUID>} componentIds Components
 * @param {number} index to insert component
 * @param {boolean} [forceProjectId=false] Use true if the block is not from this project
 * @returns {Block} Updated construct
 */
export const blockAddComponents = (blockId, componentIds, index, forceProjectId = false) => {
  return (dispatch, getState) => {
    dispatch(pauseAction());
    dispatch(undoActions.transact());

    componentIds.forEach((componentId, subIndex) => {
      dispatch(blockAddComponent(blockId, componentId, index + subIndex, forceProjectId));
    });

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return componentIds;
  };
};

/**
 * Move component within a construt
 * @param {UUID} blockId
 * @param {UUID} componentId
 * @param {number} newIndex
 * @returns {Block} Updated construct
 */
export const blockMoveComponent = (blockId, componentId, newIndex) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.moveComponent(componentId, newIndex);
    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_MOVE,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 Options
 ***************************************/

//not exposing authoring actions yet, as there is some work to be done to ensure blocks are actually part of the project etc.

//for authoring template
export const blockOptionsAdd = (blockId, ...optionIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.addOptions(...optionIds);

    dispatch({
      type: ActionTypes.BLOCK_OPTION_ADD,
      undoable: true,
      block,
    });
    return block;
  };
};

//for authoring template
export const blockOptionsRemove = (blockId, ...optionIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.removeOptions(...optionIds);

    dispatch({
      type: ActionTypes.BLOCK_OPTION_REMOVE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Toggle whether a list option is active
 * @param blockId
 * @param optionIds
 * @returns {function(*, *)}
 */
export const blockOptionsToggle = (blockId, ...optionIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.toggleOptions(...optionIds);

    dispatch({
      type: ActionTypes.BLOCK_OPTION_TOGGLE,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 * Metadata things
 ***************************************/

/**
 * Rename a block
 * @param {UUID} blockId
 * @param {string} name
 * @returns {Block} Updated Block
 */
export const blockRename = (blockId, name) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

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
};

/**
 * Set block's color
 * @param {UUID} blockId
 * @param {string} color Hex color string
 * @returns {Block} Updated Block
 */
export const blockSetColor = (blockId, color) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

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
};

/**
 * Set block's role
 * @param {UUID} blockId
 * @param {string} role Role as defined in {@link module:roles}
 * @returns {Block} Updated Block
 */
export const blockSetRole = (blockId, role) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
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
};

/***************************************
 * annotations
 ***************************************/

/**
 * Add an annotation to a block
 * @param {UUID} blockId
 * @param {Annotation} annotation
 * @returns {Block} Updated Block
 */
export const blockAnnotate = (blockId, annotation) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.annotate(annotation);
    dispatch({
      type: ActionTypes.BLOCK_ANNOTATE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Remove an annotation
 * @param {UUID} blockId
 * @param {Annotation|string} annotation Annotation or its name
 * @returns {Block} Updated Block
 */
export const blockRemoveAnnotation = (blockId, annotation) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.removeAnnotation(annotation);
    dispatch({
      type: ActionTypes.BLOCK_REMOVE_ANNOTATION,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 * Sequence
 ***************************************/

/**
 * Download a Block's sequence
 * @param {UUID} blockId Block ID with sequence to retrieve
 * @returns {Promise} Resolves to plain string of sequence
 */
export const blockGetSequence = (blockId) => {
  return (dispatch, getState) => {
    const block = getState().blocks[blockId];
    return block.getSequence();
  };
};

/**
 * Set a block's sequence, updating its source and sequence metadata
 * @param {UUID} blockId
 * @param {string} sequence Sequence string
 * @param {boolean} [useStrict] Use strict sequence validation (canonical IUPAC bases)
 * @returns {Promise} resolves to Block when the sequence has been written
 */
export const blockSetSequence = (blockId, sequence, useStrict) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    return oldBlock.setSequence(sequence, useStrict)
      .then(block => {
        dispatch({
          type: ActionTypes.BLOCK_SET_SEQUENCE,
          undoable: true,
          block,
        });
        return block;
      });
  };
};
