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
import { gsl as gslDragType } from '../../constants/DragTypes';
import GslOperatorSchema from '../../schemas/GslOperator';

import InventoryItem from './InventoryItem';

export default class InventoryItemRole extends Component {
  static propTypes = {
    operator: (props, propName) => {
      if (!GslOperatorSchema.validate(props[propName])) {
        return new Error('must pass a valid operator');
      }
    },
  };

  constructor(props) {
    super(props);

    //this comes from inventory/roles.js
    const operator = props.operator;

    //massage data format for inventoryItem
    this.operator = Object.assign({
      metadata: {
        name: operator.name,
        image: operator.image,
      },
    }, operator);
  }

  render() {
    const { operator, ...rest } = this.props;

    return (
      <div className="InventoryItemGsl">
        <InventoryItem {...rest}
          inventoryType={gslDragType}
          image={operator.image}
          item={this.operator}
          proxyText={this.operator.text}
          dataAttribute={`gsl ${operator.id}`}/>
      </div>
    );
  }
}
