import { cloneDeep, isEqual } from 'lodash';
import invariant from 'invariant';
import Instance from './Instance';
import ProjectDefinition from '../schemas/Project';
import safeValidate from '../schemas/fields/safeValidate';
import { version } from '../schemas/fields/validators';

const versionValidator = (ver, required = false) => safeValidate(version(), required, ver);

export default class Project extends Instance {
  constructor(input) {
    super(input, ProjectDefinition.scaffold());
  }

  //return an unfrozen JSON, no instnace methods
  static classless(input) {
    return Object.assign({}, cloneDeep(new Project(input)));
  }

  static validate(input, throwOnError) {
    return ProjectDefinition.validate(input, throwOnError);
  }

  //compares two projects, checking if they are the same (ignoring project version)
  static compare(one, two) {
    if (one === two) return true;

    //massage two into a temp object with fields from one that we dont want to compare
    const massaged = Object.assign(cloneDeep(two), {
      version: one.version,
    });
    return isEqual(one, massaged);
  }

  //ideally, this would just return the same instance, would be much easier
  updateVersion(sha) {
    invariant(versionValidator(sha), 'must pass valid SHA to update version');
    return this.mutate('version', sha);
  }

  addComponents(...components) {
    return this.mutate('components', this.components.concat(components));
  }

  removeComponents(...components) {
    return this.mutate('components', [...new Set(this.components.filter(comp => !components.includes(comp)))]);
  }
}
