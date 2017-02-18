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
 * Snapshots are pointers to specific versions of a project, referring to important time states (e.g. published, order generated)
 * This schema is to track what comes out of the database, and is passed to the client
 * @name Snapshot
 * @memberOf module:Schemas
 * @gc Schema
 */

const snapshotFields = {
  snapshotUUID: [
    fields.id().required,
    'snapshot UUID, in database',
  ],

  projectUUID: [
    fields.id().required,
    'project UUID, in database',
  ],

  owner: [
    fields.id().required,
    'Owner user ID, automatically set on get/set from server',
    { avoidScaffold: true },
  ],

  projectId: [
    fields.id().required,
    'projectId of associated project',
  ],

  version: [
    fields.number().required,
    'numeric version of project',
  ],

  tags: [
    fields.object().required,
    'Tags of the snapshot, where keys and values are strings',
  ],

  keywords: [
    fields.arrayOf(input => typeof input === 'string').required,
    'List of keyword strings',
  ],

  created: [
    fields.number().required,
    'When the snapshot was created',
  ],

  updated: [
    fields.number().required,
    'When the snapshot was last updated',
  ],
};

export class SnapshotSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, snapshotFields, fieldDefinitions));
  }
}

export default new SnapshotSchemaClass();
