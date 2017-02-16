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
import { keyBy, map } from 'lodash';
import invariant from 'invariant';

import * as ActionTypes from '../constants/ActionTypes';

import Rollup from '../models/Rollup';

export const initialState = {
  projects: {}, //rollups, the latest version only
  versions: {}, //versions for a particular project id
};

export default function commons(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.COMMONS_RETRIEVE_PROJECT_VERSIONS:
    case ActionTypes.COMMONS_QUERY:
      const { snapshots } = action;
      return {
        versions: { ...state.versions, ...keyBy(snapshots, 'snapshotUUID') },
        projects: state.projects,
      };

    case ActionTypes.COMMONS_RETRIEVE_PROJECT:
      const { project, projects } = action;

      const nextProjects = { ...state.projects };

      if (projects) {
        invariant(Array.isArray(projects), 'projects must be array');
        Object.assign(nextProjects, ...keyBy(map(projects, Rollup.classify), 'project.id'));
      } else {
        Object.assign(nextProjects, { [project.project.id]: Rollup.classify(project) });
      }

      return {
        versions: state.versions,
        projects: nextProjects,
      };

    case ActionTypes.USER_SET_USER :
    default:
      return state;
  }
}

