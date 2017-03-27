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
import EmailValidator from 'email-validator';
import fetch from 'isomorphic-fetch';
import _ from 'lodash';
import invariant from 'invariant';

import { headersPost } from '../../src/middleware/utils/headers';
import userConfigDefaults from '../onboarding/userConfigDefaults';
import userConfigOverrides from '../onboarding/userConfigOverrides';
import { verifyCaptchaProductionOnly } from '../utils/captcha';
import { API_END_POINT, INTERNAL_HOST } from '../urlConstants';
import { mergeConfigToUserData, pruneUserObject, updateUserAll, updateUserConfig, validateConfig } from './utils';

// send 'true' as a string to enable email verification
const SEND_VERIFY = 'true';

const logger = debug('constructor:auth');

export const authRegisterUrl = `${INTERNAL_HOST}/auth/register`;
export const authLoginUrl = `${INTERNAL_HOST}/auth/login`;
export const authUpdateUrl = `${INTERNAL_HOST}/auth/update-all`;

//transform user to send to auth routes
//will throw on errors
export function transformUserForRegistration(user, config = {}) {
  const { email, password, firstName, lastName } = user;

  invariant(email && password && firstName && lastName, 'must have all needed fields');

  //shallow assign, so explicitly declare projects + extensions, not merging with defaults
  const mergedConfig = Object.assign({}, userConfigDefaults, config);
  _.merge(mergedConfig, userConfigOverrides);

  validateConfig(mergedConfig);

  const mappedUser = mergeConfigToUserData({
    email,
    password,
    firstName,
    lastName,
    sendVerify: SEND_VERIFY,
  }, mergedConfig);

  return mappedUser;
}

//handle sending a request to the auth api + remap the cookies
export function handleAuthApiRequest(route, postBody, res, name = 'User Register', sendConfig = false) {
  return fetch(route, headersPost(JSON.stringify(postBody)))
  .then((resp) => {
    //e.g. if user already registered, just pass the error through
    if (resp.status >= 400) {
      return resp.json()
      .then(json => res.status(422).json(json));
    }

    //re-assign cookies from platform authentication
    const cookies = resp.headers.getAll('set-cookie');
    cookies.forEach((cookie) => {
      res.set('set-cookie', cookie);
    });

    return resp.json();
  })
  .then((userPayload) => {
    //logger(`[${name}] userPayload`);
    //logger(userPayload);

    if (userPayload.message) {
      return Promise.reject(userPayload);
    }

    const pruned = pruneUserObject(userPayload);
    const toSend = sendConfig === true ? pruned.config : pruned;

    res.json(toSend);
  })
  .catch((err) => {
    logger(`[${name}] Error`);
    logger(postBody);
    logger(err);
    logger(err.stack);
    res.status(500).json(err);
  });
}

//need error handling to handle them already registered
//note - expects JSON parser ahead of it
export function registrationHandler(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    logger('[User Register] invalid body for registration');
    next('must pass object to login handler, use json parser');
  }

  const { user, config } = req.body;
  const { email, password, firstName, lastName, captcha } = user;

  //basic checks before we hand off to auth/register
  if (!firstName || !lastName) {
    logger(`[User Register] name invalid: ${firstName} ${lastName}`);
    return res.status(422).json({ message: 'invalid name' });
  }
  if (!email || !EmailValidator.validate(email)) {
    logger(`[User Register] email invalid: ${email}`);
    return res.status(422).json({ message: 'invalid email' });
  }
  if (!password || password.length < 6) {
    logger(`[User Register] password invalid: ${password}`);
    return res.status(422).json({ message: 'invalid password' });
  }

  //require captcha in production so we dont get flooded / automated signups
  if (process.env.BNR_ENVIRONMENT === 'prod') {
    if (!captcha) {
      return res.status(422).json({ message: 'captcha required' });
    }
  }

  let mappedUser;
  try {
    mappedUser = transformUserForRegistration(user, config);
  } catch (err) {
    logger('[User Register] Error in input config');
    logger(err);
    logger(err.stack);
    return res.status(422).json(err);
  }

  logger('[User Register] Checking Captcha...');
  return verifyCaptchaProductionOnly(captcha)
  .then(() => {
    logger('[User Register] Captcha success');
    logger('[User Register] registering...');
    logger(mappedUser);


    return handleAuthApiRequest(authRegisterUrl, mappedUser, res, 'User Register');
  });
}

export function loginHandler(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    next('must pass object to login handler, use json parser');
  }

  const { email, password } = req.body;

  //basic checks before we hand off to auth/register
  if (!email || !EmailValidator.validate(email)) {
    logger(`[User Login] email invalid: ${email}`);
    return res.status(422).json({ message: 'invalid email' });
  }
  if (!password) {
    logger(`[User Login] password required, got: ${password}`);
    return res.status(422).json({ message: 'invalid password' });
  }

  logger('[User Login] Logging in:');
  logger(email, password, authLoginUrl);

  return handleAuthApiRequest(authLoginUrl, req.body, res, 'User Login');
}

//parameterized route handler for setting user config
//expects req.user and req.config / req.userPatch to be set
export default function updateUserHandler({ updateWholeUser = false } = {}) {
  const wholeUser = updateWholeUser === true;

  return (req, res, next) => {
    const { user: userInput, config: configInput, userPatch } = req;

    logger('[User Config]');
    logger(userInput);
    logger(userPatch);
    logger(configInput);

    if (!userInput) next('req.user must be set');
    if (wholeUser && !userPatch) next('if updating user, set req.userPatch');
    if (!wholeUser && !configInput) next('if updating config, set req.config');

    let user;

    try {
      if (wholeUser) {
        user = updateUserAll(userInput, userPatch);
      } else {
        user = updateUserConfig(userInput, configInput);
      }
    } catch (err) {
      logger('[User Config] Error Updating config:');
      logger(err);
      logger(err.stack);
      return res.status(422).json(err);
    }

    //console.log('USER CONFIG HANDLER');
    //console.log(user, userInput, configInput, userPatch);

    //todo - determine if we need this, or just use REST to keep everything consistent ??
    //to update user, issues with setting cookies as auth and making a new fetch, so call user update function
    //might want to abstract to same across local + real auth
    if (process.env.BIO_NANO_AUTH) {
      const userPromises = require('bio-user-platform').userPromises({ //eslint-disable-line
        apiEndPoint: API_END_POINT,
      });

      return userPromises.update(user)
      .then((updatedUser) => {
        const pruned = pruneUserObject(updatedUser);
        const toSend = wholeUser ? pruned : pruned.config;
        res.json(toSend);
      })
      .catch((err) => {
        logger('[User Config] error setting user config');
        logger(err);
        res.status(501).json(err);
      });
    }

    // otherwise, delegate to auth routes
    // Real auth - dont need to worry about passing cookies on fetch, since registering (not authenticated)
    // local auth - just call our mock routes
    return handleAuthApiRequest(authUpdateUrl, user, res, 'User Config', wholeUser !== true);
  };
}
