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
import _, { every, isEqual } from 'lodash';

import Project from '../models/Project';
import Block from '../models/Block';
import RollupSchema, { currentDataModelVersion } from '../schemas/Rollup';

// note - inconsistent expectations of POJOs / immutable objects. Methods will say what input should be.

const classifyProjectIfNeeded = input => (input instanceof Project) ? input : new Project(input);
const classifyBlockIfNeeded = input => (input instanceof Block) ? input : new Block(input);

/**
 * Rollups contain a 'complete' project, and are what are sent between client and server
 *
 * Rollups take the form { project: {}, blocks: {} } and may include a field 'sequence' (see the schema
 *
 * @name Rollup
 * @class
 * @gc Model
 */
export default class Rollup {
  constructor(input = {}) {
    invariant(typeof input === 'object', 'input must be an object');

    // assign to override basic fields, and ensure old schema version etc. intact
    const scaffolded = _.assign(RollupSchema.scaffold(), input);

    //update the models and schema version if needed
    Rollup.upgrade(scaffolded);

    if (Object.keys(input).length) {
      Rollup.validate(scaffolded, true);
    }

    //assign is fine, since this should be empty
    return _.assign(this, scaffolded);
  }

  /**
   * Validate a Rollup object
   * @method validate
   * @memberOf Rollup
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @param {boolean} [heavy] deeply check project + blocks, true by default in NODE_ENV=test. If false, basic structure and IDs are valid. If true, validate everything.
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Rollup.validate(new Block(), false); // false
   * Rollup.validate(new Block(), true); // throws
   * Rollup.validate(new Rollup()); //true
   */
  static validate(input, throwOnError, heavy) {
    return RollupSchema.validate(input, throwOnError, heavy);
  }

  /**
   * Compare two rollups' project and blocks
   * ignoring versioning information, e.g. see Project.compare()
   *
   * Note that this is expensive, especially for large rollups
   * @method compare
   * @memberOf Rollup
   * @static
   * @param {Rollup} one
   * @param {Rollup} two
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when not equal
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * const roll = new Rollup();
   * const other = Object.assign({}, roll);
   *
   * Rollup.compare(roll, other); //true
   * Rollup.compare(roll, new Rollup()); //false
   */
  static compare(one, two, throwOnError = false) {
    if ((typeof one === 'object') && (typeof two === 'object') && (one === two)) {
      return true;
    }

    try {
      invariant(one && two, 'must pass two rollups');

      //compare projects, throwing if error
      Project.compare(one.project, two.project, true);

      //compare blocks
      invariant(Object.keys(one.blocks).length === Object.keys(two.blocks).length, 'blocks are different number');
      invariant(every(one.blocks, (value, key) => value === two.blocks[key] || isEqual(value, two.blocks[key])), 'blocks do not match');
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }

  // POJO only
  // create rollup from project (as POJO) and N blocks (as POJO)
  // assigns projectId to all blocks
  static fromArray(project, ...blocks) {
    invariant(Project.validate(project), 'must pass valid project');

    return new Rollup({
      project,
      blocks: _.reduce(blocks, (acc, block) => Object.assign(acc, {
        [block.id]: Object.assign(block, { projectId: project.id }),
      }), {}),
    });
  }

  // POJO only
  //updates the rollup itself
  static upgrade(roll) {
    //get schema number, assume beginning of time if not provided
    const schema = Number.isInteger(roll.schema) ? roll.schema : 1;

    //waterfall through all the upgrades needed
    /* eslint-disable no-fallthrough,default-case */
    switch (schema) {
      case 1: {
        //remove authors, project.owner will be added automatically
        _.unset(roll, 'project.metadata.authors');
        //assign keywords
        const keywordsUpdate = { metadata: { keywords: [] } };
        _.defaultsDeep(roll.project, keywordsUpdate);
        _.forEach(roll.blocks, block => _.defaultsDeep(block, keywordsUpdate));
      }
    }
    /* eslint-enable no-fallthrough,default-case */

    roll.schema = currentDataModelVersion;
    return roll;
  }

  // returns model instances for blocks, project, and roll
  // will error if invalid
  static classify(roll) {
    const project = classifyProjectIfNeeded(roll.project);
    const blocks = _.mapValues(roll.blocks, classifyBlockIfNeeded);

    return new Rollup({
      project,
      blocks,
    });
  }

  // POJO only
  // mutates roll itself
  static freeze(roll) {
    //freeze project
    roll.project.rules.frozen = true;

    //freeze blocks
    _.forEach(roll.blocks, (block) => { block.rules.frozen = true; });
    return roll;
  }

  getManifest() {
    return this.project;
  }

  getOwner() {
    return this.project.owner;
  }

  getBlock(blockId) {
    return this.blocks[blockId] || null;
  }

  getBlocks(...blockIds) {
    if (!blockIds.length) {
      return this.blocks;
    }
    return _.pick(this.blocks, blockIds);
  }

  /**
   * If ID is provided, recursively get all options of a block and its components. Does not include block itself
   * If no ID provided, gets all list options in the project
   * @param {UUID} [blockId] root to get components of
   * @returns {object} with keys of blocks
   */
  getOptions(blockId) {
    if (blockId) {
      const block = this.getBlock(blockId);

      if (!block) {
        throw new Error(`Block ${blockId} not in rollup: ${this.project.id}`);
      }

      const { options } = block;

      return Object.keys(options)
      .map(optionId => this.getBlock(optionId))
      .reduce((acc, option) => Object.assign(acc, { [option.id]: option }), {});
    }

    //if no id provided, get all blocks which are options
    const optionDict = _.assign(_.map(this.blocks, block => block.options));
    return _.pickBy(this.blocks, (block, blockId) => optionDict[blockId]);
  }

  /**
   * Get components of a block
   * If ID is provided, recursively get all components of a block. Includes block itself
   * If no ID provided, gets all components in the project
   * @param {UUID} [blockId] root to get components of
   * @param [acc={}] accumulator
   * @returns {object} with keys of blocks
   */
  getComponents(blockId, acc = {}) {
    if (blockId) {
      const block = this.getBlock(blockId);

      if (!block) {
        throw new Error(`Block ${blockId} not in rollup: ${this.project.id}`);
      }

      acc[blockId] = block; //eslint-disable-line

      //recurse
      _.forEach(block.components, compId => this.getComponents(compId, acc));

      return acc;
    }

    //if no blockId, get all blocks which are not options
    const optionDict = _.assign(_.map(this.blocks, block => block.options));
    return _.omitBy(this.blocks, (block, blockId) => optionDict[blockId]);
  }

  /**
   * Recursively get contents (components + children) of a block (and returns block itself, in components)
   * @param {UUID} blockId root to get components of
   * @returns {object} { components: {}, options: {} }
   */
  getContents(blockId) {
    invariant(blockId, 'block ID is required');

    const components = this.getComponents(blockId);

    const options = Object.keys(components)
    .map(compId => components[compId])
    .filter(comp => comp.rules.list === true)
    .reduce((optionsAcc, component) => {
      const componentOptions = this.getOptions(component.id);
      return Object.assign(optionsAcc, componentOptions);
    }, {});

    return {
      components,
      options,
    };
  }

  //todo
  //given a block Id, generate a flat list of blocks without hierarchy or list blocks
  flattenConstruct(blockId, optionMap) {
    invariant(false, 'todo');
  }

  // classed only
  // future - allow passing in block / manifest parent object / overwrites as needed
  clone(owner) {
    const manifest = this.getManifest();

    const cloneGroups = manifest.components.map(constructId => this.cloneBlock(constructId, {}, { projectId: manifest.id }));

    const newManifest = manifest.clone({}, {
      owner,
      components: cloneGroups.map(group => group[0].id),
    });

    return Rollup.classify({
      project: newManifest,
      blocks: _.keyBy(_.flatten(cloneGroups), 'id'),
    });
  }

  // classed only
  // return an array of clones, with the first block the blockId passed in
  // unsets projectId
  cloneBlock(blockId, parentObjectInput, overwriteInput) {
    invariant(blockId, 'block ID is required');
    invariant(this.getBlock(blockId), 'block not found in project');

    const manifest = this.getManifest();
    const cloneNoProvenance = parentObjectInput === null;

    const parentObject = cloneNoProvenance ?
      null :
      Object.assign({
        projectId: manifest.id,
        owner: manifest.owner,
        version: manifest.version,
      }, parentObjectInput);

    const overwriteObject = Object.assign({ projectId: null }, overwriteInput);

    const { components, options } = this.getContents();
    const contents = _.values({ ...components, ...options });

    //move the blockId passed to the first position, so its the first one returned

    //create clones without updated IDs
    const unmappedClones = contents.map(block => block.clone(parentObject, overwriteObject));

    const cloneIdMap = _.zipObject(
      _.map(contents, 'id'),
      _.map(unmappedClones, 'id'),
    );

    //update components / options with new IDs
    return unmappedClones.map((clone) => {
      if (clone.isConstruct()) {
        const newComponents = clone.components.map(componentId => cloneIdMap[componentId]);
        return clone.mutate('components', newComponents);
      }
      if (clone.isList()) {
        const newOptions = _.mapKeys(clone.options, (value, key) => cloneIdMap[key]);
        return clone.mutate('options', newOptions);
      }
      return clone;
    });
  }
}
