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
import invariant from 'invariant';

const logger = debug('constructor:schemas');

/**
 * wraps a validator function to handle errors. Errors will log in non-production environments.
 *
 * @private
 *
 * @param validator {Function} function which:
 * 1) returns an Error when there is an error
 * 2) throws an error for invalid, and returns anything but false otherwise
 * @param required {Boolean=} pass `true` if required, otherwise undefined / null will validate
 * @param input {*} The input value to validate
 * @param args {...*} More args to validator
 * @return {Boolean} true if validation did not return an Error or false
 *
 * @example
 * import { email, number } from './schemas/fields/validators'
 *
 * const versionValidator = (ver, required = false) => safeValidate(number(), required, ver);
 *
 * const emailValidator = (email, required = false) => safeValidate(email(), required, email)
 */
export default function safeValidate(validator, required = false, input, ...args) {
  invariant(typeof validator === 'function', 'must pass a function');

  if (required === false && (input === undefined || input === null)) {
    return true;
  }

  try {
    const result = validator(input, ...args);

    if (result instanceof Error) {
      //don't throw here, so devTools doesnt complain on caught exceptions (at least at this point)
      //e.g. if we are checking for one of n to be satisfied, don't want to error out
      logger(result, input, ...args);
      return false;
    }

    return result !== false;
  } catch (err) {
    logger(err, input, ...args);
    return false;
  }
}
