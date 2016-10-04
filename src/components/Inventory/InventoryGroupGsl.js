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
import React, { Component } from 'react';
import { operators } from '../../inventory/gsl';
import InventoryItemGsl from './InventoryItemGsl';

export default class InventoryGroupGsl extends Component {
  constructor(props) {
    super(props);

    this.operators = operators;
  }

  render() {
    return (
      <div className="InventoryGroup-content InventoryGroupGsl">
        <div className="InventoryGroup-contentInner no-vertical-scroll">
          {Object.keys(this.operators).map(id => operators[id]).map(item => (
            <InventoryItemGsl key={item.id}
                              operator={item}/>
          ))}
        </div>
      </div>
    );
  }
}
