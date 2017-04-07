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
import invariant from 'invariant';
import { LOCATION_CHANGE } from 'react-router-redux';

import * as ActionTypes from '../constants/ActionTypes';

export const initialState = {
  forceProject: null, //forced model
  forceBlocks: [], //forced models
  blockIds: [], //ids of selection
  lastOptionId: null, // last selection option id
  constructId: null, //id of current
  level: 'project', //what to give priority to (when defined)
  options: {}, //map {listBlockId : selectedOptionId}
};

export default function inventory(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.FOCUS_FORCE_PROJECT:
      const { project } = action;
      return Object.assign({}, state, {
        forceBlocks: [],
        blockIds: [],
        constructId: null,
        forceProject: project,
        level: 'project',
      });

    case ActionTypes.FOCUS_FORCE_BLOCKS:
      const { blocks } = action;
      invariant(Array.isArray(blocks), 'must pass array to FOCUS_FORCE_BLOCKS');
      return Object.assign({}, state, {
        forceBlocks: blocks,
        forceProject: null,
        blockIds: [],
        constructId: null,
        level: 'block',
      });

    case ActionTypes.FOCUS_CONSTRUCT:
      const { constructId } = action;
      return Object.assign({}, state, {
        forceProject: null,
        forceBlocks: [],
        constructId,
        level: 'construct',
      });

    case ActionTypes.FOCUS_BLOCKS :
      const { blockIds } = action;
      invariant(Array.isArray(blockIds), 'must pass array to FOCUS_BLOCKS');
      return Object.assign({}, state, {
        forceProject: null,
        forceBlocks: [],
        blockIds,
        level: 'block',
      });

    case ActionTypes.FOCUS_PRIORITIZE :
      const { level } = action;
      return Object.assign({}, state, {
        level,
        forceProject: null,
        forceBlocks: [],
      });

    case ActionTypes.FOCUS_BLOCK_OPTION :
      const { options, lastOptionId } = action;
      return Object.assign({}, state, {
        level: 'option',
        lastOptionId,
        options,
      });

    case ActionTypes.BLOCK_OPTION_TOGGLE :
      const { block } = action;
      const currentOption = state.options[block.id];
      if (currentOption && !block.options[currentOption]) {
        const nextOptions = Object.assign({}, state.options);
        delete nextOptions[block.id];

        return Object.assign({}, state, {
          options: nextOptions,
        });
      }
      return state;

    case LOCATION_CHANGE :
    //project page sets project ID properly, running after the state changes
      return Object.assign({}, initialState);

    default :
      return state;
  }
}
