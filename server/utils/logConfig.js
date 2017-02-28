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

import morgan from 'morgan';

const devLogFormat = ':method :url :status :response-time ms :res[content-length]';
const expandedLogFormat = ':date[iso] :status :response-time ms :res[content-length] - ":method :url HTTP/:http-version" - ":referrer" - ":user-agent"';
const prodLogFormat = ':date[iso] :status :response-time ms :res[content-length] - ":method :url" - ":referrer" - ":user-agent"';

// compile them all so changes to the non-local formats aren't first complied on deployment
const devLogger = morgan.compile(devLogFormat);
const expandedLogger = morgan.compile(expandedLogFormat);
const prodLogger = morgan.compile(prodLogFormat);

// assumes a local developer won't set NODE_ENV
function chooseLogFormat() {
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`VERBOSE_REQUEST_LOGS: ${process.env.VERBOSE_REQUEST_LOGS}`);

  if (process.env.VERBOSE_REQUEST_LOGS === 'true') {
    return expandedLogger;
  }

  if (process.env.NODE_ENV === 'production') {
    return prodLogger;
  }

  if ((process.env.NODE_ENV !== 'dev') && (process.env.NODE_ENV !== 'qa') && (process.env.NODE_ENV !== 'test')) {
    console.error(`unrecognized 'NODE_ENV' value: ${process.env.NODE_ENV}`);
  }

  return devLogger;
}

export default morgan(chooseLogFormat(), {
  skip: (req, res) => {
    if ((req.path.indexOf('browser-sync') >= 0) || (req.path.indexOf('__webpack') >= 0)) {
      return true;
    }

    //skip logging in test environment, unless DEBUG is set
    return (process.env.NODE_ENV === 'test') && !process.env.DEBUG;
  },
});
