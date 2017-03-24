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
import Express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import commonsReducer from './app/reducers';
import routes from './app/routes';

import { projectVersionByUUID } from '../server/data/persistence/projectVersions';
import * as commons from '../server/data/persistence/commons';

const router = Express.Router(); //eslint-disable-line new-cap

//todo - compile CSS and serve (right now only client handles properly)

function renderFullPage(html, preloadedState) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Genetic Constructor - Commons</title>
        <link rel="stylesheet" href="/static/commons.css"></script>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
        </script>
        <script src="/static/commons.js"></script>
      </body>
    </html>
    `;
}

//todo - update react router: https://reacttraining.com/react-router/web/guides/server-rendering

async function handleRender(req, res, next) {
  const snapshots = await commons.commonsQuery();

  //todo - optimize
  const projects = await Promise.all(
    snapshots.map(({ projectUUID }) => projectVersionByUUID(projectUUID)),
  );

  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      // Create a new Redux store instance
      const store = createStore(commonsReducer, { projects, snapshots });

      // Grab the initial state from our Redux store
      const preloadedState = store.getState();

      // Render the component to a string
      const html = renderToString(
        <Provider store={store}>
          <RouterContext {...renderProps}>
            {routes}
          </RouterContext>
        </Provider>
      );

      // Send the rendered page back to the client
      res.send(renderFullPage(html, preloadedState));
    } else {
      res.status(404).send('Not found');
    }
  });
}

router.route('*').get(handleRender);

export default router;
