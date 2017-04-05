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
import { render } from 'react-dom';
import { Router } from 'react-router';
import { Provider } from 'react-redux';

import routes from './routes';
import store from './store/store';
import history from './history';

// todo - get hot-loading working
// pending react-router v4
// update react-hot-loader and get component AppContainer
// https://github.com/gaearon/react-hot-loader/tree/master/docs#migration-to-30

const renderApp = (routes) => {
  render(
    <Provider store={store}>
      <Router history={history}>
        {routes}
      </Router>
    </Provider>,
    document.getElementById('root'),
  );
};

renderApp(routes);

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./routes', () => {
    const newRoutes = require('./routes').default; //eslint-disable-line global-require
    renderApp(newRoutes);
  });
}
