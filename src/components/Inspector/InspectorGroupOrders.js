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
import { projectList } from '../../actions/projects';
import { orderList } from '../../actions/orders';
import {
  uiSetGrunt,
  uiShowOrderForm,
} from '../../actions/ui';
import Expando from '../ui/Expando';
import moment from 'moment';

import '../../styles/InspectorGroupOrders.css';

class InspectorGroupOrders extends Component {
  static propTypes = {
    uiSetGrunt: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {
      orders: [],
      loaded: false,
    };
  }

  /**
   * get all orders then display
   */
  componentDidMountXXX() {
    this.props.projectList()
    .then((projects) => {
      this.projects = projects;
      this.projects.forEach(project => {
        this.props.orderList(project.id)
        .then(orderList => {
          // fake an order
          this.setState({
            orders: this.state.orders.concat(orderList),
          });
        });
      });
    });
  }

  /**
   * get all projects and reduce to an array of promises for the orders
   */
  componentDidMount() {
    this.props.projectList()
    .then((projects) => {
      this.projects = projects;
      Promise.all(this.projects.reduce((accumulator, project) => {
        return accumulator.concat(this.props.orderList(project.id));
      }, []))
      .then((orderLists) => {
        this.setState({
          orders: [].concat.apply([], orderLists),
          loaded: true
        });
      });
    });
  }

  render() {
    return (<div className="InspectorGroupOrders">
      {this.state.loaded && this.state.orders.length === 0 ? <div className="no-label">No Orders Found</div> : null}
      {this.state.orders.map((order, index) => {
        return (<Expando
          key={index}
          text={order.metadata.name}
          content={
            <div className="content-dropdown">
              <div className="row">
                <div className="key">Project</div>
                <div
                  className="value">{this.projects.find(project => project.id === order.projectId).metadata.name || 'Unnamed Project'}</div>
              </div>
              <div className="row">
                <div className="key">Order Created</div>
                <div className="value">{moment(order.metadata.created).format('llll')}</div>
              </div>
              <div className="row">
                <div className="key">Foundry</div>
                <div className="value">{order.status.foundry}</div>
              </div>
              <div className="row">
                <div className="key">Remote ID</div>
                <div className="value">{order.status.remoteId}</div>
              </div>
              <div className="row">
                <div className="key">Time Sent</div>
                <div className="value">{moment(order.status.timeSent).format('llll')}</div>
              </div>
              <div className="row">
                <div className="value">
                  <a className="link" href="#" onClick={(event) => {
                    event.preventDefault();
                    this.props.uiShowOrderForm(true, order.id);
                  }}>Review Order</a>
                </div>
              </div>
            </div>
          }
        />);
      })}
    </div>);
  }
}

function mapStateToProps(state, props) {
// const orders = Object.keys(state.orders).reduce((accumulator, orderId) => {
//   return accumulator.concat([state.orders[orderId]]);
// }, []);
// debugger;
// return {
//   orders,
//   projects: state.projects,
// };
  return {};
}

export default connect(mapStateToProps, {
  uiSetGrunt,
  uiShowOrderForm,
  projectList,
  orderList,
})(InspectorGroupOrders);

