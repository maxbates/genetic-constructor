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
import { renderToString } from 'react-dom/server';
import React from 'react';

import Rollup from '../../src/models/Rollup';

import App from '../app/components/App';
import Home from '../app/components/Home';

const router = Express.Router(); //eslint-disable-line new-cap

//todo - compile CSS and serve (right now only client fetches)

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

  const defaultProjects = ['red', 'green', 'rebeccapurple', 'orange', 'violet', 'aquamarine'].reduce((acc, color, ind) => {
    const roll = new Rollup();

    Object.assign(roll.project.metadata, {
      name: `Project ${ind}`,
      description: 'Here is a description of the project',
      color,
    });

    return Object.assign(acc, { [roll.project.id]: roll });
  }, {});

  const initialState = { projects: defaultProjects };

  // Render the component to a string
  const html = renderToString(<App {...initialState}>
    <Home />
  </App>);

  // Send the rendered page back to the client
  res.send(renderFullPage(html, initialState));
}

router.route('*').get(handleRender);

export default router;
