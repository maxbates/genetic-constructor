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
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import PrettyError from 'pretty-error';

import { errorNotPublished } from '../server/errors/errorConstants';

import commonsReducer from './app/store/reducers';
import routes from './app/routes';
import Html from './app/components/Html';
import ErrorPage from './app/components/ErrorPage';

const router = Express.Router(); //eslint-disable-line new-cap

function handleRender(req, res, next) {
  try {
    match({ routes, location: req.originalUrl }, (error, redirectLocation, renderProps) => {
      if (error) {
        throw error;
      } else if (redirectLocation) {
        res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      } else if (renderProps) {
        //generate app initial state
        const initialState = {
          user: (req.user) ? req.user.uuid : null,
        };

        //check each route's loadData function, generate state patches
        Promise.all(renderProps.routes.map(route => route.loadData ? route.loadData(renderProps.params, renderProps.location.query) : {}))
        .then(patches => Object.assign(initialState, ...patches))
        .then(initialState => {
          // Create a new Redux store instance from initialState
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
          console.log(`Error rendering page ${req.originalUrl}`);
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
      serverOnly
    >
      {renderToString(<ErrorPage error={err} />)}
    </Html>,
  );
  res.status(err.status || 500);
  res.send(`<!doctype html>${html}`);
});

export default router;
