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
import React, { PropTypes } from 'react';

if (process.env.BROWSER) {
  require('../styles/ErrorPage.css'); //eslint-disable-line global-require
}

export default function ErrorPage({ error }) {
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className="ErrorPage">
        <p>Internal Server Error</p>
        <h1>{error.name}</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return (
    <div className="ErrorPage">
      <h1>Error</h1>
      <p>Sorry, a critical error occurred on this page.</p>
    </div>
  );
}

ErrorPage.propTypes = {
  error: PropTypes.shape({
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    stack: PropTypes.string.isRequired,
  }).isRequired,
};
