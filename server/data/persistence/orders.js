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
import { dbHead, dbGet, dbPost, dbDelete } from '../middleware/db';
import * as projectVersions from './projectVersions';

export const orderList = (projectId) => {
  return dbGet(`orders/${projectId}`);
};

//todo - this should resolve to false... need to update usages (match project persistence existence check)
export const orderExists = (orderId, projectId) => {
  return dbHead(`orders/${projectId}?id=${orderId}`)
    .then(() => true);
};

export const orderGet = (orderId, projectId) => {
  //hack - pending properly single item querying
  return dbGet(`orders/${projectId}`)
    .then(results => {
      return results.find(result => result.data.id === orderId);
    })
    .then(result => result.data);

  //return dbGet(`orders/${projectId}?orderId=${orderId}`)
  //  .then(dbPruneResult);
};

export const orderWrite = (orderId, order, userId) => {
  invariant(order.projectId, 'must have projectId defined');
  invariant(Number.isInteger(order.projectVersion), 'must have project version defined');
  invariant(!!order.status.foundry, 'foundry must be defined to write');

  const idedOrder = Object.assign({}, order, {
    id: orderId,
    user: userId,
  });

  if (!validateOrder(idedOrder)) {
    return Promise.reject(errorInvalidModel);
  }

  //make sure the given project @ version exists
  return projectVersions.projectVersionExists(idedOrder.projectId, idedOrder.projectVersion)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.reject(errorInvalidModel);
      }
      return err;
    })
    .then(() => {
      //actually write the order
      return dbPost(`orders/`, userId, idedOrder, {}, {
        projectId: order.projectId,
        projectVersion: order.projectVersion,
        type: order.status.foundry,
      });
    });
};

//not sure why you would do this...
export const orderDelete = (orderId, projectId) => {
  //do not allow... will not hit code below
  invariant(false, 'you cannot delete an order');

  return dbGet(`orders/${projectId}`)
    .then(results => {
      const result = results.find(result => result.data.id === orderId);

      return dbDelete(`orders/uuid/${result.uuid}`);
    });
};
