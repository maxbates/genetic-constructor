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
import { browserHistory, IndexRedirect, IndexRoute, Route, Router } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import AuthRouteWrapper from './components/authentication/authRouteWrapper';
import App from './components/App';
import ProjectPage from './components/ProjectPage';
import LandingPage from './components/LandingPage';
import RouteNotFound from './components/RouteNotFound';
import store from './store/index';

const history = syncHistoryWithStore(browserHistory, store, {
  selectLocationState: state => state.router,
});

export default (
  <Router history={history}>
    <Route path="/" component={App}>

      {/* require authentication */}

      <Route component={AuthRouteWrapper}>
        <Route path="/homepage/account" component={LandingPage} />
        <Route path="/project/:projectId" component={ProjectPage} />
      </Route>

      {/* do not require authentication */}

      <Route path="/homepage">
        <Route path=":comp" component={LandingPage} />
        <IndexRoute component={LandingPage} />
      </Route>

      <Route path="*" component={RouteNotFound} />

      <IndexRedirect to="/homepage" />
    </Route>
  </Router>
);
