import thunk from 'redux-thunk';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import { expect } from 'chai';
import saveLastActionMiddleware from '../../src/store/saveLastActionMiddleware';

const middlewares = [
  thunk,
  saveLastActionMiddleware,
];

//note - not an undoable store
//first two arguments required,
//combineUnderNamespace to create namespaced store automatically
export function simpleStore(initialState, reducer, combineUnderNamespace) {
  const finalReducer = (typeof combineUnderNamespace === 'string') ?
    combineReducers({ [combineUnderNamespace]: reducer }) :
    reducer;
  const finalInitialState = (typeof combineUnderNamespace === 'string') ?
  { [combineUnderNamespace]: initialState } :
    initialState;

  return applyMiddleware(...middlewares)(createStore)(finalReducer, finalInitialState);
}
