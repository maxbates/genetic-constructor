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

import Tag from './Tag';

if (process.env.BROWSER) {
  require('../styles/InfoTable.css'); //eslint-disable-line global-require
}

export default function InfoTable({ values, ...rest }) {
  return (
    <table className="InfoTable" {...rest}>
      <tbody>
        {values.map(([key, value, options = {}], index) => {
          const isArray = Array.isArray(value);

          if (!value || (isArray && value.length === 0)) {
            return null;
          }

          const { bold } = options;

          const content = isArray ? value.map((val, index) => (<Tag text={val} key={index} />)) : value;

          return (
            <tr className="InfoTable-row" key={index}>
              <td className={`InfoTable-key ${isArray ? 'tags' : ''}`}>
                {key}
              </td>
              <td className={`InfoTable-value ${bold ? 'bold' : ''}`}>
                {content}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

InfoTable.propTypes = {
  values: PropTypes.arrayOf(PropTypes.array).isRequired,
};
