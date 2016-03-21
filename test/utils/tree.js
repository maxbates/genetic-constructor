import uuid from 'node-uuid';
import range from '../../src/utils/array/range';

const createStubNode = (childField = 'components',
                        parent = {}) => {
  const obj = {
    id: uuid.v4(),
    [childField]: [],
  };
  if (parent.id) {
    Object.assign(obj, { parent: parent.id });
  }
  return obj;
};

/**
 * @description recursively generates a tree of instances, where the components are the instances themselves. You may want to flatten with flattenTree().
 * @param depth Depth of tree
 * @param numberChildren Number of child nodes
 * @param field Field name for child nodes
 * @param parent parent node, for recursing
 * @return {Object} returns tree root node, with children inside specified field
 */
const generateTree = (depth = 5,
                      numberChildren = 3,
                      field = 'components',
                      parent = createStubNode(field)) => {
  //will only happen if directly call with depth 0
  if (depth === 0) {
    return parent;
  }

  const childDepth = depth - 1;
  const nodes = range(numberChildren).map(() => {
    if (depth <= 1) {
      return Object.assign(createStubNode(field, parent), {
        depth: childDepth,
      });
    }

    const node = createStubNode(field, parent);
    //don't assign here or create circular references
    generateTree(childDepth, numberChildren, field, node);
    return node;
  });

  Object.assign(parent, {
    depth,
    [field]: nodes,
  });

  return parent;
};

/**
 * @description Flatten a tree, e.g. generated by generateTree(). Flattens nesting, and converts instances (cloned first) to list IDs of components instead of references components to components themselves.
 @param {Object} node
 @param {string|function} field (default = `components`) Field containing child instances, or function returning them
 @param {string} idField Field to use for ID
 @param {Object} result Dictionary, used for recursing. expects field `leaves`.
 @return {Object} result dictionary with IDs which are all ids, and a field `leaves` with the leaf node IDs of the tree
 **/
export const flattenTree = (node = {},
                            field = 'components',
                            idField = 'id',
                            result = { leaves: [] }) => {
  const nextAccessor = (typeof field === 'function') ?
    field :
    (instance) => instance[field];
  const next = nextAccessor(node);
  const nextIds = next.map(inst => inst[idField]);

  result[node[idField]] = Object.assign({}, node, {
    [field]: nextIds,
  });

  //if next list to recurse is empty, save as leaf
  if (!next || !next.length) {
    result.leaves.push(node.id);
  } else {
    next.forEach((instance) => {
      flattenTree(instance, field, idField, result);
    });
  }

  return result;
};

export default generateTree;
