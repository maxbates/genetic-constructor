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
import fetch from 'isomorphic-fetch';

const captchaSecret = process.env.CAPTCHA_SECRET_REGISTER;

/**
 * See https://developers.google.com/recaptcha/docs/verify
 * @param response User's response
 * @param secret Secret for sitekey to verify
 * @return {Promise}
 * @resolve when success
 * @reject on failure
 */
export function verifyCaptcha(response, secret = captchaSecret) {
  return fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`, {
    method: 'POST',
  })
  .then(resp => resp.json())
  .then((result) => {
    if (result.success) {
      return result;
    }
    return Promise.reject({ message: 'Captcha Verification Failed', ...result });
  });
}

export function verifyCaptchaProductionOnly(...args) {
  if (process.env.BNR_ENVIRONMENT === 'prod') {
    return verifyCaptcha(...args);
  }

  return verifyCaptcha(...args)
  .catch((err) => {
    console.log('captcha failed', err);
    return err;
  });
}
