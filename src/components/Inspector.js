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

import { inspectorSelectTab, inspectorToggleVisibility } from '../actions/ui';
import InspectorGroup from './Inspector/InspectorGroup';
import { _getFocused } from '../selectors/focus';
import '../styles/Inspector.css';
import '../styles/SidePanel.css';
import SectionIcon from './SectionIcon';
import InspectorRightNav from './InspectorRightNav';

export class Inspector extends Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    currentTab: PropTypes.string.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inspectorSelectTab: PropTypes.func.isRequired,
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object,
    userOwnsProject: PropTypes.bool.isRequired,
    construct: PropTypes.object,
    type: PropTypes.string.isRequired,
  };

  setActive = (group) => {
    this.props.inspectorSelectTab(group);
  };

  getTitle(tabInfo) {
    let title = tabInfo ? tabInfo.title : '';
    if (title === 'Information') {
      switch (this.props.type) {
        case 'project':
          title = 'Project Information';
          break;
        case 'construct':
          title = 'Construct Information';
          break;
        default:
          title = 'Block Information';
      }
    }
    return title;
  }

  toggle = (forceVal) => {
    this.props.inspectorToggleVisibility(forceVal);
  };

  sections = {
    Information: {
      type: 'information',
      title: 'Information',
    },
    Orders: {
      type: 'orders',
      title: 'Orders',
    },
    // Settings: {
    //   type: 'settings',
    //   title: 'Settings',
    // },
    Extensions: {
      type: 'extensions',
      title: 'Plugins',
    },
    Help: {
      type: 'help',
      title: 'Help',
    },
    History: {
      type: 'history',
      title: 'Version History',
    },
    Feedback: {
      type: 'feedback',
      title: 'Feedback',
    },
  };

  render() {
    const { isVisible, projectId, project, construct, userOwnsProject } = this.props;
    // classes for content area
    const contentClasses = `no-vertical-scroll content${isVisible ? '' : ' content-closed'}`;
    // map sections to icons
    const icons = Object.keys(this.sections).map(sectionName => (
      <SectionIcon
        key={sectionName}
        open={isVisible}
        onSelect={this.setActive}
        onToggle={() => this.toggle(!isVisible)}
        selected={this.props.currentTab === sectionName && isVisible}
        section={sectionName}
      />
    ));

    // setup content area
    const tabInfo = this.sections[this.props.currentTab];
    let tab;
    if (tabInfo) {
      tab = (
        <InspectorGroup
          tabInfo={tabInfo}
          projectId={projectId}
          project={project}
          construct={construct}
          userOwnsProject={userOwnsProject}
        />
      );
    }

    return (
      <div className={`SidePanel Inspector${isVisible ? ' visible' : ''}`}>
        <InspectorRightNav
          isVisible={isVisible}
          currentProjectId={this.props.projectId}
        />
        <span className="title">{this.getTitle(tabInfo)}</span>
        <div className="vertical-menu">
          {icons}
        </div>
        <div className="container">
          <div className={contentClasses}>
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

  const { level, blockIds, constructId } = state.focus;
  const currentProject = state.projects[props.projectId];

  const currentConstruct = state.blocks[constructId];

  //delegate handling of focus state handling to selector
  const { type, readOnly, focused } = _getFocused(state, true, props.projectId);

  //handle overrides if a list option
  const overrides = {};
  if (type === 'option') {
    const blockId = state.focus.blockIds[0];
    const block = state.blocks[blockId];
    if (block) {
      Object.assign(overrides, {
        color: block.getColor(),
        role: block.getRole(false),
      });
    }
  }

  const forceIsConstruct = (level === 'construct') ||
    blockIds.some(blockId => currentProject.components.indexOf(blockId) >= 0);

  const userOwnsProject = currentProject.owner === state.user.userid;

  return {
    isVisible,
    currentTab,
    type,
    readOnly,
    forceIsConstruct,
    projectId,
    project: currentProject,
    construct: currentConstruct,
    userOwnsProject,
    focused,
    overrides,
  };
}

export default connect(mapStateToProps, {
  inspectorToggleVisibility,
  inspectorSelectTab,
})(Inspector);
