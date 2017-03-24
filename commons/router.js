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

import Rollup from '../src/models/Rollup';

const router = Express.Router(); //eslint-disable-line new-cap

//todo - compile CSS and serve (right now only client handles properly)

//todo - routing
//todo - fetch all projects when route changes? or no dynamic routing

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

const defaultProjects = ['red', 'green', 'rebeccapurple', 'orange', 'violet', 'aquamarine'].reduce((acc, color, ind) => {
  const roll = new Rollup();

  Object.assign(roll.project.metadata, {
    name: `Project ${ind}`,
    description: 'Here is a description of the project',
    color,
  });

  return Object.assign(acc, { [roll.project.id]: roll });
}, {});

//todo - update react router: https://reacttraining.com/react-router/web/guides/server-rendering

function handleRender(req, res, next) {
  //todo - fetch all the projects

  console.log(req.url);

  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      //todo - check renderProps.routes / renderProps.components and 404 accordingly
      //console.log(renderProps);

      // Create a new Redux store instance
      const store = createStore(commonsReducer, { projects: defaultProjects });

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
