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

export const ERROR_MESSAGE_DEFAULT = 'Unexpected error. Please check your connection';

export const EMAIL_REQUIRED = 'An email address is required';
export const EMAIL_INVALID = 'Please enter a valid email address';

export const PASSWORD_REQUIRED = 'A password is required';
export const PASSWORD_LENGTH = 'Password must be 8 or more characters';
export const PASSWORD_NO_SPACES = 'Password cannot contain spaces';
export const PASSWORD_ALPHANUMERIC = 'Please use at least one number and one letter';

//returns string if error
export function emailValidator(email) {
  if (!email) {
    return EMAIL_REQUIRED;
  } else if (!(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))) {
    return EMAIL_INVALID;
  }
}

//return string if error
export function passwordValidator(password) {
  if (!password) {
    return PASSWORD_REQUIRED;
  } else if (password.length < 8) {
    return PASSWORD_LENGTH;
  } else if (/ /.test(password)) {
    return PASSWORD_NO_SPACES;
  } else if (!(/[0-9]/.test(password) && /[a-zA-Z]/.test(password))) {
    return PASSWORD_ALPHANUMERIC;
  }
}
