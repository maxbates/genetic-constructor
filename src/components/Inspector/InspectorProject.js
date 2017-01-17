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

import { projectMerge, projectRename } from '../../actions/projects';
import { uiShowOrderForm } from '../../actions/ui';
import Project from '../../models/Project';
import { abort, commit, transact } from '../../store/undo/actions';
import InputSimple from './../InputSimple';
import InspectorRow from './InspectorRow';
import OrderList from './OrderList';
import Expando from './../ui/Expando';
import PalettePicker from './../ui/PalettePicker';

export class InspectorProject extends Component {
  static propTypes = {
    instance: (props, propName) => {
      if (!(props[propName] instanceof Project)) {
        return new Error('must pass a project (Project model) to InspectorProject');
      }
    },
    orders: PropTypes.array.isRequired,
    projectRename: PropTypes.func.isRequired,
    projectMerge: PropTypes.func.isRequired,
    readOnly: PropTypes.bool.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    abort: PropTypes.func.isRequired,
    uiShowOrderForm: PropTypes.func.isRequired,
  };

  setProjectName = (name) => {
    this.props.projectRename(this.props.instance.id, name);
  };

  /**
   * user selected a new palette
   */
  onSelectPalette = (paletteName) => {
    alert(paletteName);
  };

  setProjectDescription = (description) => {
    if (description !== this.props.instance.metadata.description) {
      this.props.projectMerge(this.props.instance.id, { metadata: { description } });
    }
  };

  handleOpenOrder = (orderId) => {
    this.props.uiShowOrderForm(true, orderId);
  };

  startTransaction = () => {
    this.props.transact();
  };

  endTransaction = (shouldAbort = false) => {
    if (shouldAbort === true) {
      this.props.abort();
      return;
    }
    this.props.commit();
  };

  render() {
    const { instance, orders, readOnly } = this.props;

    return (
      <div className="InspectorContent InspectorContentProject">

        <InspectorRow heading="Project">
          <InputSimple
            placeholder="Project Name"
            onChange={this.setProjectName}
            onFocus={this.startTransaction}
            onBlur={this.endTransaction}
            onEscape={() => this.endTransaction(true)}
            readOnly={readOnly}
            maxLength={256}
            value={instance.metadata.name}
          />
        </InspectorRow>

        <InspectorRow heading="Description">
          <InputSimple
            placeholder="Project Description"
            useTextarea
            onChange={this.setProjectDescription}
            onFocus={this.startTransaction}
            onBlur={this.endTransaction}
            onEscape={() => this.endTransaction(true)}
            readOnly={readOnly}
            maxLength={2048}
            value={instance.metadata.description}
          />
        </InspectorRow>

        <Expando
          text="Color Palette"
          content={
            <PalettePicker
              palette="anime"
              onSelectPalette={this.onSelectPalette}
              readOnly={readOnly}
            />
          }
        />

        <InspectorRow
          heading="Order History"
          hasToggle
          condition={orders.length > 0}
        >
          <div className="InspectorContent-section">
            <OrderList
              orders={orders}
              onClick={orderId => this.handleOpenOrder(orderId)}
            />
          </div>
        </InspectorRow>

      </div>
    );
  }
}

export default connect(() => ({}), {
  projectRename,
  projectMerge,
  transact,
  commit,
  abort,
  uiShowOrderForm,
})(InspectorProject);
