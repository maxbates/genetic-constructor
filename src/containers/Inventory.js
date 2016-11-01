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
import { inventoryToggleVisibility, inventorySelectTab } from '../actions/ui';
import InventorySectionIcon from './InventorySectionIcon';

import InventorySideGroup from '../components/Inventory/InventorySideGroup';
import InventoryGroup from '../components/Inventory/InventoryGroup';

import '../styles/Inventory.css';
import '../styles/SidePanel.css';

export class Inventory extends Component {
  static propTypes = {
    projectId: PropTypes.string,
    isVisible: PropTypes.bool.isRequired,
    currentTab: PropTypes.string,
    inventoryToggleVisibility: PropTypes.func.isRequired,
    inventorySelectTab: PropTypes.func.isRequired,
  };

  state = {
    gslActive: false,
  };

  sections = [
    'Templates',
    'Sketch',
    'Commons',
    'Projects',
    'Ncbi',
    'Igem',
    'Egf',
  ];

  constructor(props) {
    super(props);
  }

  toggle = (forceVal) => {
    this.props.inventoryToggleVisibility(forceVal);
  };

  setActive = (group) => {
    //todo - reset search term, unless switching between two search groups
    this.props.inventorySelectTab(group);
  };

  render() {
    //may be better way to pass in projectId
    const { isVisible, projectId, currentTab } = this.props;
    // classes for content area
    const contentClasses = `content${isVisible ? '' : ' content-closed'}`;
    // classes for vertical menu
    const menuClasses = `vertical-menu${isVisible ? ' open' : ''}`;
    // map sections to icons
    const icons = this.sections.map(sectionName => {
      return <InventorySectionIcon
          key={sectionName}
          open={isVisible}
          onSelect={this.setActive}
          onToggle={() => this.toggle(!isVisible)}
          selected={this.props.currentTab === sectionName}
          section={sectionName}
        >
      </InventorySectionIcon>;
    });
    let tab;
    switch (this.props.currentTab) {
    case 'Sketch': tab = <InventoryGroup title="Sketch Library" type="role"/>; break;
    default: tab = <InventoryGroup title="Projects" type="projects"/>;
    }

    return (
      <div className={'SidePanel Inventory' + (isVisible ? ' visible' : '')}>
        <div className="container">
          <div className={menuClasses}>
            {icons}
          </div>
          <div className={contentClasses}>
            {tab}
          </div>
        </div>
      </div>
    );
  }
}
/*
    return (
      <div className={'SidePanel Inventory' + (isVisible ? ' visible' : '')}>
        <div className="container">
          <div className={menuClasses}>
            {icons}
          </div>
          <div className={contentClasses}>
            <InventoryGroup
              title="Projects"
              type="projects"
            />
          </div>
        </div>
      </div>
    );
 */

function mapStateToProps(state, props) {
  const { isVisible, currentTab } = state.ui.inventory;

  return {
    isVisible,
    currentTab,
  };
}

export default connect(mapStateToProps, {
  inventoryToggleVisibility,
  inventorySelectTab,
})(Inventory);
