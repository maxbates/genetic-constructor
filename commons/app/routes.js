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

import * as middleware from './middleware';
import App from './components/App';
import Home from './components/Home';
import Project from './components/Project';
//import RouteNotFound from '../../src/containers/routenotfound';

//todo - fetch all projects when route changes? or no dynamic routing

const onEnterProject = (nextState, replace, callback) => {
  console.log(nextState, replace);
  callback();
};

export default (
  <Route path="/commons" component={App}>
    <Route
      path="/commons/:projectId"
      component={Project}
      onEnter={onEnterProject}
    />
    <IndexRoute
      component={Home}
    />
    <Redirect from="*" to="/commons" />
  </Route>
);

