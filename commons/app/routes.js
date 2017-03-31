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
import React from 'react';
import { keyBy } from 'lodash';
import { IndexRoute, Route, Redirect } from 'react-router';

import safeValidate from '../../src/schemas/fields/safeValidate';
import { id as idValidatorCreator } from '../../src/schemas/fields/validators';

import { unsanitize } from './sanitize';
import * as middleware from './middleware';

import App from './components/App';
import Home from './components/Home';
import Project from './components/Project';
//import RouteNotFound from '../../src/containers/routenotfound';

const idValidator = id => safeValidate(idValidatorCreator(), true, id);

// future - move to react-router v4 (once out of beta) and use matchRoutes
// these can only expect a store singleton to dispatch actions to
// https://reacttraining.com/react-router/web/guides/server-rendering

// load data + create state patch on route entry
//return a state patch, because on server we need to create a new initial sate on every request, can't treat the store as a singleton
//
//on project page
//  - if search by name, figure out the projectId
//  - get the entire project and latest snapshot
//if on home page
//  - get all the projects
async function onEnterPage({ params, location }) {
  const { query } = location;
  const { projectQuery } = params;
  const forceProjectId = query.projectId;
  const forceProjectIdValid = forceProjectId && idValidator(forceProjectId);

  // determine projectId (forced by query param, or lookup from name
  let projectId;
  if (forceProjectIdValid) {
    projectId = forceProjectId;
  } else if (projectQuery) {
    const parsedQuery = unsanitize(projectQuery);
    //todo - optimize. no need to fetch this twice
    const project = await middleware.findProjectByName(parsedQuery);
    projectId = project.project.id;
  }

  //retrieve relevant snapshots and projects, filtering by projectId if on project page
  const snapshots = await middleware.getCommonsSnapshots(projectId);
  const fetchedProjects = await middleware.loadProjects(snapshots);

  //todo - isomorphic data loading (load on client)
  //todo - check state to see if project / snapshot is loaded, rather than fetching every time
  //if we're on the browser, update the store
  //if (process.env.BROWSER) {
  //  store.dispatch(actions.stashProjects(fetchedProjects));
  //  store.dispatch(actions.stashSnapshots(snapshots));
  //  return;
  //}

  //otherwise on server, return patch for initial state
  const projects = keyBy(fetchedProjects, proj => proj.project.id);
  return { projects, snapshots };
}

export default (
  <Route
    path="/commons"
    component={App}
  >
    <Route
      path="/commons/:projectQuery"
      component={Project}
      loadData={onEnterPage}
    />
    <IndexRoute
      component={Home}
      loadData={onEnterPage}
    />
    <Redirect from="*" to="/commons" />
  </Route>
);

