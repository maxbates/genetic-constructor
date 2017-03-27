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
import { LOCATION_CHANGE, routerReducer as router } from 'react-router-redux';
import { combineReducers } from 'redux';

import { USER_SET_USER } from '../constants/ActionTypes';
import freezeReducerEnhancer from '../store/freezeReducerEnhancer';
import autosaveCreator from '../store/autosave/autosaveCreator';
import { autosaveInstanceDefaultOptions } from '../store/autosaveOptions';
import { undoReducerEnhancerCreator } from '../store/undo/reducerEnhancer';
import blocks from './blocks';
import clipboard from './clipboard';
import commons from './commons';
import focus from './focus';
import inspector from './inspector';
import inventory from './inventory';
import orders from './orders';
import projects from './projects';
import snapshots from './snapshots';
import ui from './ui';
import user from './user';

//export a function, so we can create multiple configurations (e.g. in tests... b/c e.g. undoEnhancer is backed by a singleton which supports coordination across reducers)

export const createRootReducer = () => {
  //undo

  const undoPurgingEvents = [LOCATION_CHANGE, USER_SET_USER];

  const undoReducerEnhancer = undoReducerEnhancerCreator({
    purgeOn: action => undoPurgingEvents.some(type => type === action.type),
  });

  //auto save (which annoyingly depends on undo manager transaction state for proper filtering)
  //filter on undoable actions (basically, the state changes we care about) and save UNLESS in a transaction
  const autosaveFilterFn = (action, alreadyDirty, nextState, lastState) => !!action.undoable;

  const autosaveInstance = autosaveCreator({
    ...autosaveInstanceDefaultOptions,
    filter: autosaveFilterFn,
    //do not want to allow when in the middle of a transaction
    preventOn: () => undoReducerEnhancer.manager.inTransaction(),
  });

  const { autosaveReducer, autosaveReducerEnhancer } = autosaveInstance;

  //final reducer

  return freezeReducerEnhancer(combineReducers({
    router,

    // autosave + undo
    blocks: autosaveReducerEnhancer(undoReducerEnhancer(blocks, 'blocks')),
    projects: autosaveReducerEnhancer(undoReducerEnhancer(projects, 'projects')),

    //note - These are usually one step behind, since reducer enhancers need to run first
    autosave: autosaveReducer,
    undo: undoReducerEnhancer.manager.getUndoState.bind(undoReducerEnhancer.manager),

    //not autosaved or undoable
    commons,
    orders,
    snapshots,
    user,

    // app state
    clipboard,
    focus,
    inventory,
    inspector,
    ui,
  }));
};

export default createRootReducer;
