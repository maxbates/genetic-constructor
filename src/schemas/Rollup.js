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

import fields from './fields/index';
import * as validators from './fields/validators';
import SchemaClass from './SchemaClass';
import ProjectSchema from './Project';
import BlockSchema from './Block';
import { id as idRegex } from '../utils/regex';

//todo - tests for rollup validation utils

const sequenceMd5Validator = validators.sequenceMd5({ real: true });
const sequenceValidator = validators.sequence();
const idValidator = (value) => {
  if (!idRegex().test(value)) {
    return new Error(`invalid id, got ${value}`);
  }
};
const seqObjectBlocksValidator = validators.objectOf((value, key) => {
  if (!(value === true || (Array.isArray(value) && value.length === 2 && value[1] > value[0]))) {
    return new Error(`invalid sequence range specified for ${key}: ${value}`);
  }
  return idValidator(key);
});

const rollupFields = {
  project: [
    ProjectSchema,
    'Project Manifest',
  ],

  blocks: [
    fields.objectOf((value, key) => {
      return idValidator(key) && BlockSchema.validate(value, true);
    }),
    'Blocks Manifest',
  ],

  sequences: [
    fields.oneOfType([
      validators.arrayOf((value) => {
        return sequenceValidator(value.sequence) && seqObjectBlocksValidator(value.blocks);
      }),
      //todo - deprecate this one in the future
      validators.objectOf((value, key) => {
        return sequenceMd5Validator(key) && sequenceValidator(value);
      }),
    ]),
    `Sequences, transiently part of the rollup, e.g. to batch write`,
  ],
};

export class RollupSchemaClass extends SchemaClass {
  constructor(fieldDefinitions) {
    super(Object.assign({}, rollupFields, fieldDefinitions));
  }

  validate(instance, shouldThrow, cheapOnly = false) {
    if (cheapOnly === true) {
      return typeof instance === 'object' &&
        typeof instance.project === 'object' &&
        typeof instance.blocks === 'object' &&
        idRegex().test(instance.project.id);
    }

    const fieldsValid = super.validateFields(instance, shouldThrow);

    if (!fieldsValid) {
      return false;
    }

    //todo - limit other fields
    //todo - make sure projectId in each block matches

    return true;
  }
}

export default new RollupSchemaClass();
