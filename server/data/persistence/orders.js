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
import { dbGet, dbPost, dbPruneResult } from '../middleware/db';


/*********
 Helpers
 *********/

const _orderWrite = (orderId, order = {}, projectId) => {
  //todo - write the order, mae sure have a version (should run after saving the project)
  return dbPost(`orders/${projectId}/${orderId}`);
};

/*********
 API
 *********/

export const orderList = (projectId) => {
  return dbGet(`orders/${projectId}`)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return [];
      }
      return Promise.reject(err);
    });
};

//todo - this should resolve to false... need to update usages (match project persistence existence check)
export const orderExists = (orderId, projectId) => {
  return dbGet(`orders/${projectId}/${orderId}`)
    .then(() => true)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.reject(errorDoesNotExist);
      }
      return Promise.reject(err);
    });
};

export const orderGet = (orderId, projectId) => {
  return dbGet(`orders/${projectId}/${orderId}`)
    .then(dbPruneResult)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
};

//todo - require userId as arg + update usages
//todo - require projectVersion as arg
export const orderWrite = (userId, orderId, order, projectId, projectVersion, roll) => {
  //todo - invariant checks on inputs

  const idedOrder = Object.assign({}, order, {
    id: orderId,
    projectId,
    projectVersion,
  });

  if (!validateOrder(idedOrder)) {
    return Promise.reject(errorInvalidModel);
  }

  //todo - get rollup and write with order --- or just the project id and version?

  return _orderWrite(orderId, idedOrder, projectId)
    .then(() => idedOrder);
};

//not sure why you would do this...
export const orderDelete = (orderId, projectId) => {
  invariant(false, 'you cannot delete an order');
};


//todo - once this module is done, remove some stuff from querying.js
