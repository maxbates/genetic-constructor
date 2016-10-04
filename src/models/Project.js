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
import { cloneDeep, isEqual } from 'lodash';
import invariant from 'invariant';
import Instance from './Instance';
import ProjectSchema from '../schemas/Project';
import safeValidate from '../schemas/fields/safeValidate';
import { id, version } from '../schemas/fields/validators';

const idValidator = (input, required = false) => safeValidate(id(), required, input);
const versionValidator = (ver, required = false) => safeValidate(version(), required, ver);

/**
 * Projects are the containers for a body of work, including all their blocks, preferences, orders, and files.
 * Projects are versioned using git, and save their most recent SHA in project.version
 * @name Project
 * @class
 * @extends Instance
 * @gc Model
 */
export default class Project extends Instance {
  /**
   * Create a project given some input object
   * @memberOf Project
   * @param {Object} [input]
   * @returns {Project}
   */
  constructor(input) {
    super(input, ProjectSchema.scaffold());
  }

  /**
   * Create an unfrozen project, extending input with schema
   * @method classless
   * @memberOf Project
   * @param {Object} [input]
   * @returns {Object} an unfrozen JSON, no instance methods
   */
  static classless(input) {
    return Object.assign({}, cloneDeep(new Project(input)));
  }

  /**
   * Validate a Project data object
   * @method validate
   * @memberOf Project
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Project.validate(new Block()); //false
   * Project.validate(new Project()); //true
   */
  static validate(input, throwOnError) {
    return ProjectSchema.validate(input, throwOnError);
  }

  /**
   * compares two projects, checking if they are the same (ignoring project version + save time)
   * @method compare
   * @memberOf Project
   * @static
   * @param {Object} one
   * @param {Object} two
   * @returns {boolean} whether equal
   */
  static compare(one, two) {
    if (!one || !two) return false;
    if (one === two) return true;

    //massage two into a temp object with fields from one that we dont want to compare
    const massaged = two.merge({
      version: one.version,
      lastSaved: one.lastSaved,
    });

    return isEqual(one, massaged);
  }

  /**
   * Set name of the project
   * @method setName
   * @memberOf Project
   * @param {string} name
   * @throws if not a string
   * @returns {Project}
   */
  setName(name) {
    invariant(typeof name === 'string', 'must pass name string');
    return this.mutate('metadata.name', name);
  }

  /**
   * Get name of Project
   * @method getName
   * @memberOf Project
   * @returns {string}
   */
  getName() {
    return this.metadata.name || 'Untitled Project';
  }

  //ideally, this would just return the same instance, would be much easier
  /**
   * Update the version of the project. Returns a new Instance, so use {@link Project.compare} to check if two projects are the same and ignore the version
   * @method updateVersion
   * @memberOf Project
   * @param {string} version Must be a valid SHA
   * @param {number} [lastSaved=Date.now()] POSIX time
   * @returns {Project}
   */
  updateVersion(version, lastSaved = Date.now()) {
    invariant(versionValidator(version), 'must pass valid SHA to update version');
    invariant(Number.isInteger(lastSaved), 'must pass valid time to update version');
    return this.merge({ version, lastSaved });
  }

  /**
   * Add constructs to the Project
   * @method addComponents
   * @memberOf Project
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  addComponents(...components) {
    invariant(components.length && components.every(comp => idValidator(comp)), 'must pass component IDs');
    return this.mutate('components', components.concat(this.components));
  }

  /**
   * Remove constructs from the project
   * @method removeComponents
   * @memberOf Project
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  removeComponents(...components) {
    return this.mutate('components', [...new Set(this.components.filter(comp => components.indexOf(comp) < 0))]);
  }
}
