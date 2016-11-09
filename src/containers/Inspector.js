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
import InspectorGroup from '../components/Inspector/InspectorGroup';


import '../styles/Inspector.css';
import '../styles/SidePanel.css';

export class Inspector extends Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    currentTab: PropTypes.string.isRequired,
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
    const { isVisible, projectId } = this.props;
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
      tab = <InspectorGroup tabInfo={tabInfo} projectId={projectId} />;
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
  const projectId = props.projectId;
  return {
    isVisible,
    currentTab,
    projectId,
  };
}

export default connect(mapStateToProps, {
  inspectorToggleVisibility,
  inspectorSelectTab,
})(Inspector);
