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
import InventorySectionIcon from './InventorySectionIcon';
import {
  inspectorToggleVisibility,
  inspectorSelectTab,
} from '../actions/ui';
import { _getFocused } from '../selectors/focus';
import InspectorGroup from '../components/Inspector/InspectorGroup';


import '../styles/Inspector.css';
import '../styles/SidePanel.css';

export class Inspector extends Component {
  static propTypes = {
    isVisible: PropTypes.bool,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    readOnly: PropTypes.bool.isRequired,
    isAuthoring: PropTypes.bool.isRequired,
    forceIsConstruct: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired,
    focused: PropTypes.any.isRequired,
    orders: PropTypes.array.isRequired,
    overrides: PropTypes.object.isRequired,
  };

  toggle = (forceVal) => {
    this.props.inspectorToggleVisibility(forceVal);
  };

  setActive = (group) => {
    this.props.inspectorSelectTab(group);
  };

  sections = {
    Information: {
      type: 'information',
      title: 'Information',
    },
    Settings: {
      type: 'settings',
      title: 'Settings',
    },
    Extensions: {
      type: 'extensions',
      title: 'Plugins',
    },
    Help: {
      type: 'help',
      title: 'Help',
    },
    Orders: {
      type: 'orders',
      title: 'Orders',
    },
    History: {
      type: 'history',
      title: 'History',
    },
  };

  render() {
    //may be better way to pass in projectId
    const { isVisible } = this.props;
    // classes for content area
    const contentClasses = `content${isVisible ? '' : ' content-closed'}`;
    // classes for vertical menu
    const menuClasses = `vertical-menu${isVisible ? ' open' : ''}`;
    // map sections to icons
    const icons = Object.keys(this.sections).map(sectionName => {
      return (<InventorySectionIcon
        key={sectionName}
        open={isVisible}
        onSelect={this.setActive}
        onToggle={() => this.toggle(!isVisible)}
        selected={this.props.currentTab === sectionName}
        section={sectionName}
      />);
    });

    // setup content area
    const tabInfo = this.sections[this.props.currentTab];
    let tab;
    if (tabInfo) {
      tab = <InspectorGroup tabInfo={tabInfo} />;
    }

    return (
      <div className={'SidePanel Inspector' + (isVisible ? ' visible' : '')}>
        <div className="container">
          <div className={menuClasses}>
            {icons}
          </div>
          <div className={contentClasses}>
            <div className="titleHolder">
              <span className="title">{tabInfo.title}</span>
            </div>
            {tab}
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { isVisible, currentTab } = state.ui.inspector;

  const { level, blockIds } = state.focus;
  const currentProject = state.projects[props.projectId];

  //delegate handling of focus state handling to selector
  const { type, readOnly, focused } = _getFocused(state, true, props.projectId);

  //handle overrides if a list option
  const overrides = {};
  if (type === 'option') {
    const blockId = state.focus.blockIds[0];
    const block = state.blocks[blockId];
    if (!!block) {
      Object.assign(overrides, {
        color: block.getColor(),
        role: block.getRole(false),
      });
    }
  }

  const forceIsConstruct = (level === 'construct') ||
    blockIds.some(blockId => currentProject.components.indexOf(blockId) >= 0);

  const isAuthoring = !!state.focus.constructId && state.blocks[state.focus.constructId].isAuthoring() && focused.length === 1 && type !== 'project' && !readOnly;

  const orders = Object.keys(state.orders)
    .map(orderId => state.orders[orderId])
    .filter(order => order.projectId === currentProject.id && order.isSubmitted())
    .sort((one, two) => one.status.timeSent - two.status.timeSent);

  return {
    isVisible,
    currentTab,
    type,
    readOnly,
    focused,
    forceIsConstruct,
    orders,
    overrides,
    isAuthoring,
  };
}

export default connect(mapStateToProps, {
  inspectorToggleVisibility,
  inspectorSelectTab,
})(Inspector);
