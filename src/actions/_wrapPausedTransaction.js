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

import { pauseAction, resumeAction } from '../store/pausableStore';
import * as undoActions from '../store/undo/actions';

/**
 * wrap some actions in a paused transaction
 * pauses subscriptions from running, but still runs reducers and updates the store
 * @private
 * @param dispatch Store dispatch function
 * @param transaction The actions to call. Can return promise, which will delay commit/abort of the transaction. Otherwise, remains synchronous.
 */
export default function pausableTransaction(dispatch, transaction) {
  dispatch(pauseAction());
  dispatch(undoActions.transact());

  const returned = transaction();

  //don't wrap in Promise.resolve(), or will make the action async when supposed to be synchronous
  //handle if its a promise
  if (typeof returned.then === 'function') {
    return returned
    .then((resolved) => {
      dispatch(undoActions.commit());
      dispatch(resumeAction());
      return resolved;
    })
    .catch((err) => {
      dispatch(undoActions.abort());
      dispatch(resumeAction());
      throw err;
    });
  }

  dispatch(undoActions.commit());
  dispatch(resumeAction());

  return returned;
};
