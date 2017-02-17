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

import debug from 'debug';
import * as errors from './errorConstants';

const logger = debug('constructor:server:errors');

// Middleware to handle our custom errors with appropriate status codes
export default function customErrorMiddleware(err, req, res, next) {
  logger('custom error middleware');
  logger(err);

  if (err === errors.errorNotPublished) {
    //hide forbidden, just say it doesn't exist
    return res.status(404).send(errors.errorDoesNotExist);
  } else if (err === errors.errorDoesNotExist) {
    return res.status(404).send(errors.errorDoesNotExist);
  } else if (err === errors.errorNoPermission) {
    return res.status(403).send(errors.errorNoPermission);
  } else if (err === errors.errorInvalidModel) {
    return res.status(422).send(errors.errorInvalidModel);
  }

  //these guys are probably our fault and should throw better, here for backwards compatibility...
  if (err === errors.errorVersioningSystem) {
    return res.status(500).send(errors.errorVersioningSystem);
  }

  next(err);
}
