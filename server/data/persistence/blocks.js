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
import _ from 'lodash';
import { dbGet } from '../middleware/db';
import { getUserProjects } from './projects';

const reduceToMap = array => _.keyBy(array, block => block.id);

//expensive
export const getAllBlocks = (userId) => {
  return getUserProjects(userId, true)
    .then(rolls => _.reduce(rolls, (acc, roll) => Object.assign(acc, roll.blocks), {}));
};

export const getAllBlocksWithName = (userId, name) => {
  return dbGet(`/blocks/name/${userId}/${name}`)
    .then(reduceToMap);
};

export const getAllPartsWithRole = (userId, role) => {
  return dbGet(`/blocks/role/${userId}/${role}`)
    .then(reduceToMap);
};

export const getAllBlockRoles = (userId) => {
  return dbGet(`/blocks/role/${userId}`);
};
