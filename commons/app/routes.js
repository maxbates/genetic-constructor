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
import { IndexRoute, Route, Redirect } from 'react-router';

import safeValidate from '../../src/schemas/fields/safeValidate';
import { id as idValidatorCreator } from '../../src/schemas/fields/validators';

import * as actions from './store/actions';
import { getState, dispatch } from './store/store';

import App from './components/App';
import Home from './components/Home';
import Project from './components/Project';
//import RouteNotFound from '../../src/containers/routenotfound';

const idValidator = id => safeValidate(idValidatorCreator(), true, id);

// we use onEnter to fetch data before entering a route
// todo - move to react-router v4 (once out of beta) and use matchRoutes, rather than onEnter
// https://reacttraining.com/react-router/web/guides/server-rendering

//todo - check state to see if project / snapshot is loaded

const onEnterProject = (nextState, replace, callback) => {
  console.log(nextState, replace);
  console.log('waiting...');
  setTimeout(() => callback(), 2000);
};

const onEnterHome = (nextState, replace, callback) => {
  console.log(nextState, replace);
  console.log('waiting...');
  setTimeout(() => callback(), 2000);
};

export default (
  <Route
    path="/commons"
    component={App}
  >
    <Route
      path="/commons/:projectId"
      component={Project}
      onEnter={onEnterProject}
    />
    <IndexRoute
      onEnter={onEnterHome}
      component={Home}
    />
    <Redirect from="*" to="/commons" />
  </Route>
);

