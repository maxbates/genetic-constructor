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
import Schema from './SchemaClass';

/**
 * Information about a placed order
 * @name OrderStatusSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const fieldDefs = {
  foundry: [
    fields.string().required,
    `key of foundry the Order has been submitted to`,
  ],

  remoteId: [
    fields.string().required,
    `ID at remote foundry`,
  ],

  price: [
    fields.any(),
    `Quote for the order`,
  ],

  timeSent: [
    fields.number(),
    `Time when the order was sent, in MS`,
  ],
};

export class OrderStatusSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new OrderStatusSchemaClass();

