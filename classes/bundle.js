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
import Block from '../src/models/Block';
import Project from '../src/models/Project';
import Rollup from '../src/models/Rollup';
import Order from '../src/models/Order';

import fields from '../src/schemas/fields/index';
import BlockSchema from '../src/schemas/Block';
import ProjectSchema from '../src/schemas/Project';
import RollupSchema from '../src/schemas/Rollup';
import OrderSchema from '../src/schemas/Order';

export const models = {
  Block,
  Project,
  Rollup,
  Order,
};

export { fields };

export const schemas = {
  Block: BlockSchema,
  Project: ProjectSchema,
  Rollup: RollupSchema,
  Order: OrderSchema,
};
