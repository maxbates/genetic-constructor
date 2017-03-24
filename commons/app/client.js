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

//store
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import commonsReducer from './reducers';

//components
import App from './components/App';
import Home from './components/Home';


// get passed state; allow the passed state to be garbage-collected
const preloadedState = window.__PRELOADED_STATE__;
delete window.__PRELOADED_STATE__;

const store = createStore(commonsReducer, preloadedState);

render(
  <Provider store={store}>
    <App>
      <Home />
    </App>
  </Provider>,
  document.getElementById('root'),
);
