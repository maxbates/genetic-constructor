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
import Schema from './SchemaClass';
import fields from './fields/index';

/**
 * Block Attribution tracks provenance of users claiming ownership over a block
 * @name BlockAttributionSchemaClass
 * @memberOf module:Schemas
 * @gc Schema
 */
const blockAttributionFields = {
  owner: [
    fields.id().required,
    'user ID',
    { avoidScaffold: true },
  ],

  text: [
    fields.string().required,
    'URL to resource, relative paths are relative to genetic construct root URL',
    { avoidScaffold: true },
  ],

  time: [
    fields.number().required,
    'URL to file, relative paths are relative to genetic construct root URL',
    { scaffold: () => Date.now() },
  ],
};

export class BlockAttributionSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, blockAttributionFields, fieldDefinitions));
  }
}

export default new BlockAttributionSchemaClass();
