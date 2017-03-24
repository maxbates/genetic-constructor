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

import React from 'react';

import Tag from './Tag';

export default function InfoTable({ values }) {
  return (
    <div className="InfoTable">
      {values.map(([key, value], index) => {
        if (!value) {
          return null;
        }

        const content = Array.isArray(value) ? value.map(val => (<Tag text={val} />)) : value;

        return (
          <div className="InfoTable-row" key={index}>
            <div className="InfoTable-key">
              {key}
            </div>
            <div className="InfoTable-val">
              {content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
