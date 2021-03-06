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
import { keyBy } from 'lodash';

import * as ActionTypes from '../constants/ActionTypes';

export const initialState = {};

export default function snapshots(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.SNAPSHOT_PROJECT:
    case ActionTypes.SNAPSHOT_RETRIEVE :
    case ActionTypes.SNAPSHOT_QUERY:
    case ActionTypes.SNAPSHOT_LIST:
    case ActionTypes.COMMONS_PUBLISH:
    case ActionTypes.COMMONS_QUERY:
    case ActionTypes.COMMONS_UNPUBLISH:
      const { snapshot, snapshots } = action;
      if (Array.isArray(snapshots)) {
        return { ...state, ...keyBy(snapshots, 'snapshotUUID') };
      }

      return { ...state, [snapshot.snapshotUUID]: snapshot };

    case ActionTypes.USER_SET_USER :
      return { ...initialState };

    default:
      return state;
  }
}
