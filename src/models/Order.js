import Instance from './Instance';
import invariant from 'invariant';
import { merge, cloneDeep } from 'lodash';
import OrderDefinition from '../schemas/Order';
import OrderParametersDefinition from '../schemas/OrderParameters';
import * as validators from '../schemas/fields/validators';
import safeValidate from '../schemas/fields/safeValidate';

const idValidator = (id) => safeValidate(validators.id(), true, id);

export default class Order extends Instance {
  constructor(projectId, input = {}) {
    invariant(projectId, 'project is required to make an order');

    super(input, OrderDefinition.scaffold(), {
      projectId,
    });
  }

  /************
   constructors etc.
   ************/

  //return an unfrozen JSON, no instance methods
  static classless(input) {
    return Object.assign({}, cloneDeep(new Order(input)));
  }

  //validate a complete order (with a project ID, which is after submission)
  static validate(input, throwOnError = false) {
    return OrderDefinition.validate(input, throwOnError);
  }

  //validate order prior to submission - should have parameters, constructs, user, projectId
  static validateSetup(input, throwOnError = false) {
    return idValidator(input.project) &&
      input.constructIds.length > 0 &&
      input.constructIds.every(id => idValidator(id)) &&
      input.constructs.length > 0 &&
      input.constructs.every(construct => Array.isArray(construct) && construct.every(part => typeof part === 'string')) &&
      OrderParametersDefinition.validate(input.parameters, throwOnError) &&
      typeof input.user === 'string';
  }

  static validateParameters(input, throwOnError = false) {
    return OrderParametersDefinition.validate(input, throwOnError);
  }

  clone() {
    invariant('cannot clone an order');
  }

  /************
   metadata etc
   ************/

  setName(newName) {
    const renamed = this.mutate('metadata.name', newName);
    return renamed;
  }

  isSubmitted() {
    return this.status.foundry && this.status.remoteId;
  }

  /************
   parameters, user, other information
   ************/

  setParameters(parameters = {}, shouldMerge = false) {
    const nextParameters = merge({}, (shouldMerge === true ? this.parameters : {}), parameters);
    invariant(OrderParametersDefinition.validate(parameters, false), 'parameters must pass validation');
    return this.merge({ parameters: nextParameters });
  }

  /************
   constructs + filtering
   ************/

  constructsAdd(...constructs) {
    //todo - update to expect ID
  }

  constructsRemove(...constructs) {
    //todo - update to expect ID
  }

  /************
   quote + submit
   ************/

  quote(foundry) {

  }

  submit(foundry) {
    //set foundry + remote ID in status
    //write it to the server
    //return the updated order
  }

}
