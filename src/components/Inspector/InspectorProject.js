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

import { projectSetDescription, projectRename, projectSetPalette, projectSetKeywords } from '../../actions/projects';
import { uiShowOrderForm } from '../../actions/ui';
import Project from '../../models/Project';
import { abort, commit, transact } from '../../store/undo/actions';
import { blockSetPalette } from '../../actions/blocks';
import { getPaletteName } from '../../utils/color/index';

import InputSimple from '../formElements/InputSimple';
import FormKeywords from '../formElements/FormKeywords';
import InspectorRow from './InspectorRow';
import OrderList from './OrderList';
import PalettePicker from './../ui/PalettePicker';
import { getLocal } from '../../utils/localstorage';

export class InspectorProject extends Component {
  static propTypes = {
    instance: (props, propName) => {
      if (!(props[propName] instanceof Project)) {
        return new Error('must pass a project (Project model) to InspectorProject');
      }
    },
    orders: PropTypes.array.isRequired,
    projectRename: PropTypes.func.isRequired,
    projectSetPalette: PropTypes.func.isRequired,
    projectSetKeywords: PropTypes.func.isRequired,
    blockSetPalette: PropTypes.func.isRequired,
    projectSetDescription: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    userOwnsProject: PropTypes.bool.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    abort: PropTypes.func.isRequired,
    uiShowOrderForm: PropTypes.func.isRequired,
  };

  /**
   * user selected a new palette, apply to all constructs in the project.
   */
  onSelectPalette = (paletteName) => {
    // apply to project and all of its construct
    this.props.projectSetPalette(this.props.instance.id, paletteName);
    const { instance } = this.props;
    instance.components.forEach((constructId) => {
      this.props.blockSetPalette(constructId, paletteName);
    });
  };

  setProjectName = (name) => {
    this.props.projectRename(this.props.instance.id, name);
  };

  setProjectDescription = (description) => {
    this.props.projectSetDescription(this.props.instance.id, description);
  };

  setKeywords = (keywords) => {
    this.props.projectSetKeywords(this.props.instance.id, keywords);
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
    const { instance, orders, readOnly, userOwnsProject } = this.props;
    const paletteName = getPaletteName(instance.metadata.palette);
    // determines the default state of the palette expando
    const paletteStateKey = 'expando-color-palette';
    // text before palette, depends on expanded state.
    const paletteOpen = getLocal(paletteStateKey, false, true);
    let colorPaletteText = 'Color Palette';
    if (!paletteOpen) {
      colorPaletteText += `: ${paletteName}`;
    }

    return (
      <div className="InspectorContent InspectorContentProject">

        <InspectorRow heading="Project">
          <InputSimple
            placeholder="Project Name"
            onChange={this.setProjectName}
            onFocus={this.startTransaction}
            onBlur={this.endTransaction}
            onEscape={() => this.endTransaction(true)}
            readOnly={readOnly || !userOwnsProject}
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
            readOnly={readOnly || !userOwnsProject}
            maxLength={2048}
            value={instance.metadata.description}
          />
        </InspectorRow>

        <InspectorRow heading="Keywords">
          <FormKeywords
            keywords={instance.metadata.keywords}
            onChange={this.setKeywords}
            disabled={readOnly || !userOwnsProject}
          />
        </InspectorRow>

        <InspectorRow
          heading={colorPaletteText}
          hasToggle
          capitalize
        >
          <PalettePicker
            paletteName={paletteName}
            onSelectPalette={this.onSelectPalette}
            readOnly={readOnly}
          />
        </InspectorRow>

        <InspectorRow
          heading="Order History"
          hasToggle
          condition={orders.length > 0}
        >
          <OrderList
            orders={orders}
            onClick={orderId => this.handleOpenOrder(orderId)}
          />
        </InspectorRow>

      </div>
    );
  }
}

export default connect(null, {
  projectRename,
  projectSetPalette,
  projectSetDescription,
  projectSetKeywords,
  transact,
  commit,
  abort,
  uiShowOrderForm,
  blockSetPalette,
})(InspectorProject);
