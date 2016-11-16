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
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Switch from '../ui/Switch';
import registry from '../../extensions/clientRegistry';
import Expando from '../ui/Expando';

import {
  uiSetGrunt,
} from '../../actions/ui';

import '../../styles/InspectorGroupOrders.css';

class InspectorGroupOrders extends Component {
  static propTypes = {
    uiSetGrunt: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {};
  }

  orders = [
    {
      orderId: 'face-1234',
      when: new Date().toISOString(),
      status: 'Pending',
    },
    {
      orderId: 'abcd-5678',
      when: new Date().toISOString(),
      status: 'Fulfilled',
    },
    {
      orderId: 'xyza-7777',
      when: new Date().toISOString(),
      status: 'Rejected',
    },
    {
      orderId: 'squk-7700',
      when: new Date().toISOString(),
      status: 'MIA',
    },
  ];
  render() {
    return (<div className="InspectorGroupOrders">
      {this.orders.map((order, index) => {
        return (<Expando
          key={index}
          text={'Order: ' + order.orderId}
          content={
            <div className="content-dropdown">
              <div className="row">
                <div className="key">When</div>
                <div className="value">{order.when}</div>
              </div>
              <div className="row">
                <div className="key">Status</div>
                <div className="value">{order.status}</div>
              </div>
            </div>
          }
        />);
      })}
    </div>);
  }
}

function mapStateToProps(state, props) {
  return {};
}

export default connect(mapStateToProps, {
  uiSetGrunt,
})(InspectorGroupOrders);

