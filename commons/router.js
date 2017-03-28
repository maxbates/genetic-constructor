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
        <meta charset="utf-8">
        <title>Genetic Constructor - Commons</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Genetic Constructor Commons hosts published projects and constructs from users.">
        <meta name="author" content="Autodesk Life Sciences">
        <meta name="keywords" content="genetic design software, genetic design tool, dna sequence editor, molecular design software, promoter library, CAD software for biology">
        <link rel="canonical" href="https://geneticconstructor.bionano.autodesk.com">
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
//todo - enable hot loading: https://github.com/gaearon/react-hot-loader/tree/master/docs#migration-to-30

//todo - routing by name, not hash
//todo - only fetch all projects if root request, not for project pages

async function handleRender(req, res, next) {
  const snapshots = await commons.commonsQuery();

  //todo - optimize - call multiple at once
  const projects = (await Promise.all(
    snapshots.map(({ projectUUID }) => projectVersionByUUID(projectUUID)),
  )).reduce((acc, project) => ({ ...acc, [project.project.id]: project }), {});

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
      //todo - move 404 rendering into the app
      res.status(404).send('Not found');
    }
  });
}

router.route('*').get(handleRender);

export default router;
