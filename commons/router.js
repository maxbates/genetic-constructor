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
import safeValidate from '../src/schemas/fields/safeValidate';
import { id as idValidatorCreator } from '../src/schemas/fields/validators';
import { errorNotPublished } from '../server/errors/errorConstants';

import commonsReducer from './app/store/reducers';
import routes from './app/routes';
import Html from './app/components/Html';
import ErrorPage from './app/components/ErrorPage';
import * as middleware from './app/middleware';

const router = Express.Router(); //eslint-disable-line new-cap

const idValidator = id => safeValidate(idValidatorCreator(), true, id);

async function getInitialState(req) {
  const projectQuery = req.url.substr(1);
  const forceProjectId = req.query.projectId;

  const initialState = {
    user: (req.user) ? req.user.uuid : null,
  };

  // todo - put data fetching in the router. router should be async
  // todo - don't use onEnter, use some other property and handle ourselves?
  // todo - ideally, update store from routes. But routes onEnter expects singleton. reconcile!

  //on project page
  //  - if search by name, figure out the projectId
  //  - get the entire project and latest snapshot
  //if on home page
  //  - get all the projects
  //  - todo - omit bp count, or add to published snapshot as tag

  const atHome = !(projectQuery || forceProjectId);
  const projectId = atHome ?
    undefined :
    (forceProjectId && idValidator(forceProjectId)) ?
      forceProjectId :
      (await middleware.findProjectByName(projectQuery));

  // now, either we have a projectId or we don't
  // if we do, the query will be filtered appropriately
  console.log('projectId', projectId, projectQuery, forceProjectId, idValidator(forceProjectId));

  const snapshots = await middleware.getCommonsSnapshots(projectId);
  const fetchedProjects = await middleware.loadProjects(snapshots);

  // todo - should dispatch actions to the store

  const projects = _.keyBy(fetchedProjects, proj => proj.project.id);
  return Object.assign(initialState, { projects, snapshots });
}

function handleRender(req, res, next) {
  try {
    match({ routes, location: req.originalUrl }, (error, redirectLocation, renderProps) => {
      if (error) {
        throw error;
      } else if (redirectLocation) {
        res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      } else if (renderProps) {
        getInitialState(req, res)
        .then(initialState => {
          // Create a new Redux store instance
          const store = createStore(commonsReducer, initialState);

          // Grab the initial state from our Redux store
          const preloadedState = store.getState();

          // Render the component to a string, with React Ids
          const appHtml = renderToString(
            <Provider store={store}>
              <RouterContext {...renderProps}>
                {routes}
              </RouterContext>
            </Provider>,
          );

          //render the rest of the HTML as static markup
          const html = renderToStaticMarkup(<Html state={preloadedState}>{appHtml}</Html>);
          res.send(`<!doctype html>${html}`);
        })
        .catch(err => {
          console.log('Error rendering page');
          console.log(err);

          if (err === errorNotPublished) {
            return res.status(302).redirect('/commons');
          }

          throw err;
        });
      } else {
        //this shouldn't happen, app should catch all 404 routes
        res.status(404).send('Not found');
      }
    });
  } catch (err) {
    next(err);
  }
}

router.route('/*').get(handleRender);

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
