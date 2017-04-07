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

import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';

import * as actionTypes from './actionTypes';

const user = (state = null, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return action.user;
    default:
      return state;
  }
};

//projects reducer
const projects = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.STASH_PROJECTS:
      return { ...state, ...action.projects };
    default:
      return state;
  }
};

//snapshots reducer
const snapshots = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.STASH_SNAPSHOTS:
      return { ...state, ...action.snapshots };
    default:
      return state;
  }
};

export default combineReducers({
  router,
  user,
  projects,
  snapshots,
});

