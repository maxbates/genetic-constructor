import Block from '../../models/Block';
import range from '../array/range';

function createBlock(parentId) {
  return Object.assign({}, new Block(), {
    parent: parentId,
  });
}

const identity = (item) => item;

export default function generateBlockTree(depth = 5,
                                          numberChildren = 3,
                                          transformer = identity,
                                          dropThreshold = 1,
                                          parent = createBlock(null)) {
  //will only happen if directly call with depth 0
  if (depth === 0) {
    return parent;
  }

  const childDepth = depth - 1;
  const nodes = range(numberChildren).map(() => {
    const node = transformer(createBlock(parent.id));

    if (depth <= 1 || Math.random() < dropThreshold) {
      return Object.assign(node, {
        depth: childDepth,
      });
    }

    //don't assign here or create circular references
    generateBlockTree(childDepth, numberChildren, transformer, dropThreshold, node);
    return node;
  });

  Object.assign(parent, {
    depth,
    components: nodes,
  });

  return parent;
}
