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

import { renderToString } from 'react-dom/server';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import App from '../app/components/App';
import commonsReducer from '../app/reducers';

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
          // note - Consider security implications 
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
        </script>
        <script src="/static/commons.js"></script>
      </body>
    </html>
    `;
}

function handleRender(req, res, next) {
  //todo - fetch all the projects
  //todo - do we need a store?

  // Create a new Redux store instance
  const store = createStore(commonsReducer);

  // Render the component to a string
  const html = renderToString(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // Grab the initial state from our Redux store
  const preloadedState = store.getState();

  // Send the rendered page back to the client
  res.send(renderFullPage(html, preloadedState));
}