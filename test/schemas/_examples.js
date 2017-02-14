import uuid from 'node-uuid';
import merge from 'lodash.merge';

/*
 * Note that there are scaffolding functions available on each schema.
 * These models are intentionally to note when changes to the schema occurs - see rest of /test/schemas
 */

/* NB - IF YOU ARE CHANGING THESE MODELS, THEN IT IS LIKELY THE DATABASE NEEDS TO BE UPDATED */

export const Block = {
  id: uuid.v4(),
  parents: [],
  metadata: {
    tags: {},
    keywords: [],
  },
  sequence: {
    annotations: [],
  },
  source: {},
  options: {},
  components: [],
  rules: {},
  notes: {},
};

export const Project = {
  id: uuid.v4(),
  owner: uuid.v1(),
  version: 12,
  parents: [],
  metadata: {
    tags: {},
    keywords: [],
  },
  components: [],
  settings: {},
  files: [],
  rules: {},
};

export const Annotation = {
  name: 'annotation name',
  description: 'example annotation',
  tags: {},
  start: 25,
  end: 50,
  isForward: true,
  sequence: 'acgtagc',
  notes: { 'applicability': 'always'},
};

export const makeParent = () => ({
  id: uuid.v4(),
  owner: uuid.v1(),
  version: 0,
});

export const blockWithParents = merge(Block, {
  parents: [makeParent(), makeParent()],
});
