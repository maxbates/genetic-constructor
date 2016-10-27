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
import { errorDoesNotExist, errorInvalidModel } from '../../utils/errors';
import { validateOrder } from '../../utils/validation';
//import * as permissions from '../permissions';

/*********
 Helpers
 *********/

const _orderExists = (orderId, projectId) => {
  //todo
};

const _orderRead = (orderId, projectId) => {
  //todo
};

const _orderWrite = (orderId, order = {}, projectId) => {
  //todo - write the order, mae sure have a version (should run after save)
};

/*********
 API
 *********/

export const orderList = (projectId) => {
  //todo
};

export const orderExists = (orderId, projectId) => {
  return _orderExists(orderId, projectId);
};

export const orderGet = (orderId, projectId) => {
  return _orderRead(orderId, projectId)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
};

//todo - require projectVersion as arg
export const orderWrite = (orderId, order, projectId, roll) => {
  const idedOrder = Object.assign({}, order, {
    projectId,
    id: orderId,
  });

  if (!validateOrder(idedOrder)) {
    return Promise.reject(errorInvalidModel);
  }

  //todo - get rollup and write with order --- or just the project id and version?

  return Promise.all([
    _orderWrite(orderId, idedOrder, projectId),
    //_orderRollupWrite(orderId, roll, projectId),
  ])
    .then(() => idedOrder);
};

//not sure why you would do this...
export const orderDelete = (orderId, projectId) => {
  invariant(false, 'you cannot delete an order');
};


//todo - once this module is done, remove some stuff from querying.js
