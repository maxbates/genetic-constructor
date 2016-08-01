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
import invariant from 'invariant';
import BlockSchema from '../schemas/Block';
import { values, flatten, get as pathGet, pickBy } from 'lodash';
import saveCombinations from '../utils/generators/orderConstructs';

const assertBlockExists = (block, blockId) => invariant(block && block.metadata, 'no block exists for block ID ' + blockId);

/***************************************
 * Parent accessing / store knowledge-requiring
 ***************************************/

const _getBlockFromStore = (blockId, store) => {
  const block = store.blocks[blockId] || null;
  assertBlockExists(block, blockId);
  return block;
};

const _getParentFromStore = (blockId, store, def = null) => {
  const id = Object.keys(store.blocks).find(id => {
    const block = _getBlockFromStore(id, store);
    return block.components.indexOf(blockId) > -1;
  });
  return !!id ? store.blocks[id] : def;
};

//ommitting constructId will just return first found list owner
const _getListOwnerFromStore = (optionId, constructId, store) => {
  const block = _getBlockFromStore(optionId, store); //assert option is in the store
  const contents = !!constructId ? _getAllContents(constructId, store) : store.blocks;
  return Object.keys(contents)
    .map(blockId => contents[blockId])
    .find(block => block.options.hasOwnProperty(optionId));
};

//todo - move to object
const _getComponentsShallow = (blockId, store) => {
  const block = _getBlockFromStore(blockId, store);
  return block.components.map(id => _getBlockFromStore(id, store));
};

//todo - move to object
const _getAllComponents = (rootId, store, children = []) => {
  const kids = _getComponentsShallow(rootId, store);
  if (kids.length) {
    children.push(...kids);
    kids.forEach(kid => _getAllComponents(kid.id, store, children));
  }
  return children;
};

const _getAllComponentsByDepth = (rootId, store, children = {}, depth = 1) => {
  const kids = _getComponentsShallow(rootId, store);
  if (kids.length) {
    kids.forEach(kid => {
      children[kid.id] = depth;
      _getAllComponentsByDepth(kid.id, store, children, depth + 1);
    });
  }
  return children;
};

//returns map
const _getOptionsShallow = (blockId, store) => {
  const block = _getBlockFromStore(blockId, store);
  return Object.keys(block.options)
    .map(id => _getBlockFromStore(id, store))
    .reduce((acc, block) => Object.assign(acc, { [block.id ]: block }), {});
};

//returns map
const _getAllOptions = (rootId, store, includeUnselected) => {
  const components = _getAllComponents(rootId, store);
  //for each component (in flat list), create map of options, and assign to accumulator, return accumulator
  return components.reduce((acc, block) => {
    return Object.assign(acc,
      block.getOptions(includeUnselected)
        .map(optionId => _getBlockFromStore(optionId, store))
        .reduce((acc, option) => Object.assign(acc, { [option.id]: option }), {}));
  }, {});
};

const _getAllContents = (rootId, state) => {
  const options = _getAllOptions(rootId, state);
  const components = _getAllComponents(rootId, state).reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
  return Object.assign(options, components);
};

const _filterToLeafNodes = (blocks) => blocks.filter(child => !child.components.length);

const _getParents = (blockId, state) => {
  const parents = [];
  let parent = _getParentFromStore(blockId, state);
  while (parent) {
    parents.push(parent);
    parent = _getParentFromStore(parent.id, state);
  }
  return parents;
};

const _getSiblings = (blockId, state) => {
  const parent = _getParentFromStore(blockId, state, {});
  return (parent.components || []).map(id => _getBlockFromStore(id, state));
};

//returns map of { optionId : option }
const _getOptions = (blockId, state, includeUnselected = false) => {
  const block = _getBlockFromStore(blockId, state);
  invariant(block.isList(), 'must pass a list block to get its options');

  return block.getOptions(includeUnselected)
    .reduce((acc, optionId) => Object.assign(acc, {
      [optionId]: _getBlockFromStore(optionId, state),
    }), {});
};

// flattens component hierarchy
// returns flat array of blocks, not touching list blocks
const _flattenConstruct = (blockId, state) => {
  const block = _getBlockFromStore(blockId, state);
  if (!block.isConstruct()) {
    return [block];
  }

  const components = block.components
    .map(compId => _getBlockFromStore(compId, state));

  return flatten(components.map(component => component.isConstruct() ?
    _flattenConstruct(component.id, state) :
    [component]
  ));
};

//e.g. _getWithFieldValue('metadata.name', 'my block', state)
const _getWithFieldValue = (path, value, store) => {
  return pickBy(store.blocks, (block) => pathGet(block, path) === value);
};

export const blockGet = (blockId) => {
  return (dispatch, getState) => {
    return _getBlockFromStore(blockId, getState());
  };
};

export const blockGetBlocksWithName = (name) => {
  return (dispatch, getState) => {
    return _getWithFieldValue('metadata.name', name, getState());
  };
};

export const blockGetParent = (blockId) => {
  return (dispatch, getState) => {
    return _getParentFromStore(blockId, getState());
  };
};

//first parent is direct parent, last parent is construct
//returns blocks, not ids
export const blockGetParents = (blockId) => {
  return (dispatch, getState) => {
    return _getParents(blockId, getState());
  };
};

//i.e. get construct, or null if it is the construct (or detached)
export const blockGetParentRoot = (blockId) => {
  return (dispatch, getState) => {
    const parents = _getParents(blockId, getState());
    return parents.length ? parents.pop() : null;
  };
};

export const blockGetComponentsRecursive = (blockId) => {
  return (dispatch, getState) => {
    return _getAllComponents(blockId, getState());
  };
};

export const blockGetComponentsByDepth = (blockId) => {
  return (dispatch, getState) => {
    return _getAllComponentsByDepth(blockId, getState());
  };
};

//returns object
export const blockGetOptionsRecursive = (blockId) => {
  return (dispatch, getState) => {
    return _getAllOptions(blockId, getState());
  };
};

//returns object
export const blockGetContentsRecursive = (blockId) => {
  return (dispatch, getState) => {
    return _getAllContents(blockId, getState());
  };
};

//get all non-constructs
//todo - move to object
//todo - include list blocks
export const blockGetLeaves = (blockId) => {
  return (dispatch, getState) => {
    return _filterToLeafNodes(_getAllComponents(blockId, getState()));
  };
};

export const blockGetSiblings = (blockId) => {
  return (dispatch, getState) => {
    const state = getState();
    return _getSiblings(blockId, state);
  };
};

//this could be optimized...
const _getBoundingBlocks = (state, ...blockIds) => {
  const construct = _getParentFromStore(blockIds[0], state);
  if (!construct) {
    return null;
  }
  const depthMap = _getAllComponentsByDepth(construct.id, state);
  const idsToDepth = blockIds.reduce((acc, id) => Object.assign(acc, { [id]: depthMap[id] }), {});
  const highestLevel = blockIds.reduce((acc, id) => Math.min(acc, idsToDepth[id]), Number.MAX_VALUE);
  const blocksIdsAtHighest = blockIds.filter(id => idsToDepth[id] === highestLevel);
  const highSiblings = _getSiblings(blocksIdsAtHighest[0], state);

  //dumb search of all children of siblings to see if focused block present
  const relevantSiblings = highSiblings.filter(sibling => {
    if (blockIds.indexOf(sibling.id) >= 0) {
      return true;
    }
    const kids = _getAllComponents(sibling.id, state);
    return kids.some(kid => blockIds.indexOf(kid.id) >= 0);
  });
  const relevantSiblingIds = relevantSiblings.map(sib => sib.id);

  //get the bounds of highest level siblings: [firstId, lastId]
  return [
    highSiblings.find(sib => relevantSiblingIds.indexOf(sib.id) >= 0),
    highSiblings.slice().reverse().find(sib => relevantSiblingIds.indexOf(sib.id) >= 0),
  ];
};

export const blockGetBounds = (...blockIds) => {
  return (dispatch, getState) => {
    return _getBoundingBlocks(getState(), ...blockIds);
  };
};

export const blockGetRange = (...blockIds) => {
  return (dispatch, getState) => {
    const state = getState();
    const bounds = _getBoundingBlocks(state, ...blockIds);
    if (!bounds) {
      return null;
    }
    const siblings = _getSiblings(bounds[0].id, state);
    const [boundStart, boundEnd] = bounds.map(boundBlock => siblings.findIndex(sibling => sibling.id === boundBlock.id));
    return siblings.slice(boundStart, boundEnd + 1);
  };
};

export const blockGetIndex = (blockId) => {
  return (dispatch, getState) => {
    const parent = _getParentFromStore(blockId, getState(), {});
    return Array.isArray(parent.components) ? parent.components.indexOf(blockId) : -1;
  };
};

const _checkSingleBlockIsSpec = (block) => {
  invariant(!block.isList() && !block.isConstruct(), 'list blocks + constructs are not specs');
  return block.sequence.length > 0;
};

export const blockIsSpec = (blockId) => {
  return (dispatch, getState) => {
    const store = getState();
    const flattened = _flattenConstruct(blockId, store);

    return flattened.every(block => {
      if (block.isList()) {
        //only want selected options
        const options = values(_getOptions(block.id, store, false));
        return options.length > 0 && options.every(selectedBlock => _checkSingleBlockIsSpec(selectedBlock));
      }
      return _checkSingleBlockIsSpec(block);
    });
  };
};

export const blockIsValid = (model) => {
  return (dispatch, getState) => {
    return BlockSchema.validate(model);
  };
};

export const blockHasSequence = blockId => {
  return (dispatch, getState) => {
    const block = _getBlockFromStore(blockId, getState());
    return !!block && block.hasSequence();
  };
};

//constructId is required as list options may exist in multiple places within a project - should be lowest known parent
export const blockGetListOwner = (optionId, constructId) => {
  return (dispatch, getState) => {
    return _getListOwnerFromStore(optionId, constructId, getState());
  };
};

export const blockIsListOption = (optionId, constructId, returnParentId = false) => {
  return (dispatch, getState) => {
    const state = getState();
    const block = _getBlockFromStore(optionId, state);

    //basic checks
    if (block.isConstruct() || block.isList()) {
      return false;
    }

    const listOwner = _getListOwnerFromStore(optionId, constructId, state);

    if (!listOwner) {
      return false;
    }

    return !!returnParentId ? listOwner.id : true;
  };
};

/*
 deprecated filters for now
 //expects object block.rules.filter
 export const blockGetFiltered = filters => {
 return (dispatch, getState) => {
 invariant(typeof filters === 'object', 'must pass ovject of filters');
 const blockState = getState().blocks;

 return Object.keys(blockState)
 .map(id => blockState[id])
 .filter(block => {
 return Object.keys(filters).every(key => {
 const value = filters[key];
 return pathGet(block, key) === value;
 });
 });
 };
 };
 */

//given a construct, returns an array of parts that have sequence / are list blocks, including hidden blocks
export const blockFlattenConstruct = (blockId) => {
  return (dispatch, getState) => {
    return _flattenConstruct(blockId, getState());
  };
};

/*
 returns 2D array - based on position - of block combinations (including hidden blocks), e.g.

 given:
 A: { sequence }                                        //single part
 B: { options: {2: true, 3: true, 4: true, 5: false } } //list block with 3 selected options
 C: { options: { 6: true } }                            //list block, one option

 generates:
 [
 [A],
 [block2, block3, block4],
 [block6],
 ]
 */
export const blockGetPositionalCombinations = (blockId, onlyIds = false, includeUnselected = false) => {
  return (dispatch, getState) => {
    invariant(dispatch(blockIsSpec(blockId)), 'block must be a spec to get combinations');

    const state = getState();

    //generate 2D array, outer array for positions, inner array with lists of parts
    const combinations = _flattenConstruct(blockId, state)
      .map(block => block.isList() ?
        values(_getOptions(block.id, state, includeUnselected)) :
        [block]
      );

    return (onlyIds === true) ?
      combinations.map(combo => combo.map(part => part.id)) :
      combinations;
  };
};

export const blockGetNumberCombinations = (blockId, includeUnselected = false) => {
  return (dispatch, getState) => {
    const positions = dispatch(blockGetPositionalCombinations(blockId, includeUnselected));
    return positions.reduce((acc, position) => acc * position.length, 1);
  };
};
/*
 returns 2D array of all possible constructs, flattened, and with options unfurled, including hidden blocks

 given:
 A: { sequence }                                        //single part
 B: { options: {2: true, 3: true, 4: true, 5: false } } //list block with 3 selected options
 C: { options: { 6: true } }                            //list block, one option

 generates:
 [
 [A, block2, block6],
 [A, block3, block6],
 [A, block4, block6],
 ]
 */
export const blockGetCombinations = (blockId, onlyIds, includeUnselected) => {
  return (dispatch, getState) => {
    const positions = dispatch(blockGetPositionalCombinations(blockId, onlyIds, includeUnselected));

    /*
    //guarantee both accumulator (and positions) array have at least one item to map over
    const last = positions.pop();
    //iterate through positions, essentially generating tree with * N branches for N options at position
    const combos = positions.reduceRight((acc, position) => {
      // for each extant construct, create one variant which adds each part respectively
      // flatten them for return and repeat!
      return flatten(position.map(option => acc.map(partialConstruct => [option].concat(partialConstruct))));
    }, [last]);
    return combos;
    */

    const combinations = [];
    saveCombinations(positions, combinations);
    return combinations;
  };
};

export const blockFlattenConstructAndLists = (blockId) => {
  return (dispatch, getState) => {
    const state = getState();
    const optionPreferences = state.focus.options;
    const flattened = _flattenConstruct(blockId, state);
    return flattened.map(block => {
      const options = block.getOptions();
      const preference = optionPreferences[block.id];
      return (block.isList() && options.length) ?
        //give the block a color if in a list - technically the block in the store but all immutable so whatever
        //clone it because technically frozen
        state.blocks[preference || options[0]]
          .clone(null)
          .merge({ metadata: { color: block.metadata.color } }) :
        block;
    });
  };
};
