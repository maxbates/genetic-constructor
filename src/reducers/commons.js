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
import { omitBy, keyBy, some } from 'lodash';
import invariant from 'invariant';

import * as ActionTypes from '../constants/ActionTypes';

export const initialState = {
  projects: {}, //rollups, the latest version only
  versions: {}, //versions for a particular project id
};

export default function commons(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.COMMONS_PUBLISH:
    case ActionTypes.COMMONS_RETRIEVE_PROJECT_VERSIONS:
    case ActionTypes.COMMONS_QUERY:
      const { snapshot, snapshots } = action;

      const nextVersions = { ...state.versions };

      if (snapshots) {
        invariant(Array.isArray(snapshots), 'snapshots must be array');
        Object.assign(nextVersions, keyBy(snapshots, 'snapshotUUID'));
      } else {
        Object.assign(nextVersions, { [snapshot.snapshotUUID]: snapshot });
      }

      return {
        versions: nextVersions,
        projects: state.projects,
      };

    case ActionTypes.COMMONS_RETRIEVE_PROJECT:
      const { project, projects } = action;

      const nextProjects = { ...state.projects };

      if (projects) {
        invariant(Array.isArray(projects), 'projects must be array');
        Object.assign(nextProjects, keyBy(projects, 'project.id'));
      } else {
        Object.assign(nextProjects, { [project.project.id]: project });
      }

      return {
        versions: state.versions,
        projects: nextProjects,
      };

    case ActionTypes.COMMONS_UNPUBLISH:
      const { projectId, version } = action;

      //just remove the specific version
      if (Number.isInteger(version)) {
        const nextVersions = omitBy(state.versions, snapshot => snapshot.projectId === projectId && snapshot.version === version);
        const stillHaveProject = some(nextVersions, snapshot => snapshot.projectId === projectId);
        const nextProjects = stillHaveProject ? state.projects : omitBy(state.projects, rollup => rollup.project.id === projectId);

        return {
          versions: nextVersions,
          projects: nextProjects,
        };
      }

      //remove all traces of the project
      return {
        versions: omitBy(state.versions, snapshot => snapshot.projectId === projectId),
        projects: omitBy(state.projects, rollup => rollup.project.id === projectId),
      };

    case ActionTypes.PROJECT_LOAD: {
      const { rollup, userOwnsProject } = action;
      //if not owned, add it
      //if owner + project is published (according to snapshots loaded), save it in commons
      if (!userOwnsProject || some(state.versions, snapshot => snapshot.projectId === rollup.project.id)) {
        return {
          versions: state.versions,
          projects: { ...state.projects, [rollup.project.id]: rollup },
        };
      }
      return state;
    }

    case ActionTypes.USER_SET_USER :
    default:
      return state;
  }
}

