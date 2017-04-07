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
import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import '../../styles/ordermodal.css';
import { orderList, orderSetName, orderSetParameters } from '../../actions/orders';
import Checkbox from './checkbox';
import Input from './input';
import Permutations from './permutations';
import Row from './row';
import Selector from './selector';

const assemblyOptions = [
  'All in a single container',
  'Each in an individual container',
];

const methodOptions = [
  'Random Subset',
  'Maximum Unique Set',
];

export class Page1 extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    order: PropTypes.object.isRequired,
    orderSetName: PropTypes.func.isRequired,
    orderSetParameters: PropTypes.func.isRequired,
    //orderList: PropTypes.func.isRequired,
    //blocks: PropTypes.object.isRequired,
    numberCombinations: PropTypes.number.isRequired,
  };

  constructor() {
    super();
    //todo - this should use a transaction + commit, not deboucne like this. See InputSimple
    this.labelChanged = _.debounce(value => this._labelChanged(value), 500, { leading: false, trailing: true });
  }

  assemblyContainerChanged = (newValue) => {
    const onePot = newValue === assemblyOptions[0];
    const { order, numberCombinations } = this.props;

    //merge old with new parameters
    const parameters = _.merge({
      permutations: numberCombinations,
    }, order.parameters, {
      onePot,
    });

    //set combinatorial method if one not set
    if (!parameters.combinatorialMethod) {
      parameters.combinatorialMethod = 'Random Subset';
    }

    this.props.orderSetParameters(this.props.order.id, parameters, true);
  };

  _labelChanged = (newLabel) => {
    this.props.orderSetName(this.props.order.id, newLabel);
  };

  /**
   * debounced for performance
   */
  numberOfAssembliesChanged = (total) => {
    this.props.orderSetParameters(this.props.order.id, {
      permutations: total,
    }, true);
  };

  methodChanged = (newMethod) => {
    this.props.orderSetParameters(this.props.order.id, {
      combinatorialMethod: newMethod,
    }, true);
  };

  sequenceAssemblies = (state) => {
    this.props.orderSetParameters(this.props.order.id, {
      sequenceAssemblies: state,
    }, true);
  };

  render() {
    // no render when not open
    if (!this.props.open) {
      return null;
    }

    const { order } = this.props;

    //why is this a label?
    let method = <label>All Combinations</label>; //eslint-disable-line jsx-a11y/label-has-for

    if (!order.parameters.onePot) {
      method = (<Selector
        disabled={order.isSubmitted()}
        value={order.parameters.combinatorialMethod}
        options={methodOptions}
        onChange={this.methodChanged}
      />);
    }

    return (
      <div className="order-page page1">
        <fieldset disabled={order.isSubmitted()}>
          <Row text="Label:">
            <Input
              onChange={this.labelChanged}
              value={this.props.order.metadata.name}
            />
          </Row>
          <Row text="Assembly Containers:">
            <Selector
              disabled={order.isSubmitted()}
              value={assemblyOptions[order.parameters.onePot ? 0 : 1]}
              options={assemblyOptions}
              onChange={val => this.assemblyContainerChanged(val)}
            />
          </Row>
          <Row text="Number of assemblies:">
            <Permutations
              total={this.props.numberCombinations}
              value={this.props.order.parameters.permutations}
              editable={!order.parameters.onePot}
              disabled={order.isSubmitted()}
              onBlur={(val) => {
                this.numberOfAssembliesChanged(val);
              }}
            />
          </Row>
          <Row text="Combinatorial method:">
            {method}
          </Row>
          <Row text="After fabrication:">
            <Checkbox
              onChange={this.sequenceAssemblies}
              label="Sequence Assemblies"
              value={order.parameters.sequenceAssemblies}
              disabled={order.parameters.onePot}
            />
          </Row>
          <br />
        </fieldset>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    blocks: state.blocks,
    numberCombinations: props.order.numberCombinations,
  };
}

export default connect(mapStateToProps, {
  orderSetName,
  orderSetParameters,
  orderList,
})(Page1);
