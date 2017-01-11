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

import * as snapshots from './snapshots';

//todo - this file may not be necessary
//may be able to just use project persistence + snapshots

export const lockProjectDeep = (roll) => {
  //todo - do we need to clone?
  const locked = _.cloneDeep(roll);

  //freeze project
  locked.project.rules.frozen = true;

  //freeze blocks
  _.forEach(locked.blocks, (block) => { block.rules.frozen = true; });
  return locked;
};

export const checkProjectPublic = (projectId, version) => {

};
