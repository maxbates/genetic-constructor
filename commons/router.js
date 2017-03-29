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
import _ from 'lodash';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import PrettyError from 'pretty-error';

import { projectVersionByUUID } from '../server/data/persistence/projectVersions';
import * as commons from '../server/data/persistence/commons';

import commonsReducer from './app/reducers';
import routes from './app/routes';
import Html from './app/components/Html';
import ErrorPage from './app/components/ErrorPage';

const router = Express.Router(); //eslint-disable-line new-cap

//todo - update react router: https://reacttraining.com/react-router/web/guides/server-rendering

//todo - routing by name, not hash

//todo - only fetch all projects on main page, no blocks

//todo - optimize - single call with multiple UUIDs

// todo - update react-hot-loader and get component AppContainer
// https://github.com/gaearon/react-hot-loader/tree/master/docs#migration-to-30

async function handleRender(req, res, next) {
  try {
    const snapshots = await commons.commonsQuery();

    const fetchedProjects = await Promise.all(
      snapshots.map(({ projectUUID }) => projectVersionByUUID(projectUUID)),
    );

    const projects = _.keyBy(fetchedProjects, proj => proj.project.id);

    match({ routes, location: req.originalUrl }, (error, redirectLocation, renderProps) => {
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
        const appHtml = renderToString(
          <Provider store={store}>
            <RouterContext {...renderProps}>
              {routes}
            </RouterContext>
          </Provider>,
        );

        const html = renderToStaticMarkup(
          <Html state={preloadedState}>
          {appHtml}
          </Html>
        );
        res.send(`<!doctype html>${html}`);
      } else {
        //todo - move 404 rendering into the app
        res.status(404).send('Not found');
      }
    });
  } catch (err) {
    next(err);
  }
}

router.route('*').get(handleRender);

//
// Error handling
// -----------------------------------------------------------------------------
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('express');

router.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.log(pe.render(err)); // eslint-disable-line no-console

  const html = renderToStaticMarkup(
    <Html
      title="Internal Server Error"
      description={err.message}
      scripts={[]}
    >
      {renderToString(<ErrorPage error={err} />)}
    </Html>,
  );
  res.status(err.status || 500);
  res.send(`<!doctype html>${html}`);
});

export default router;
