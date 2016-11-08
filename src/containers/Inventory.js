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

  constructor(props) {
    super(props);
  }

  state = {
    gslActive: false,
  };

  setActive = (group) => {
    this.props.inventorySelectTab(group);
  };

  toggle = (forceVal) => {
    this.props.inventoryToggleVisibility(forceVal);
  };

  sections = {
    Projects: {
      type: 'projects',
      title: 'Projects',
      search: {
        placeholder: 'Filter projects',
      },
    },
    Templates: {
      type: 'templates',
      title: 'Templates',
      search: {
        placeholder: 'Filter templates',
      },
    },
    Sketch: {
      type: 'role',
      title: 'Sketch Blocks',
      search: {
        placeholder: 'Filter sketch blocks',
      },
    },
    Commons: null,
    Ncbi: {
      type: 'search-ncbi',
      title: 'NCBI Search',
      search: {
        source: 'ncbi',
        placeholder: 'Keyword, biological function',
      },
    },
    Igem: {
      type: 'search-igem',
      title: 'IGEM Search',
      search: {
        source: 'igem',
        placeholder: 'Keyword, biological function',
      },
    },
    Egf: {
      type: 'search-egf',
      title: 'EGF Search',
      search: {
        source: 'egf',
        placeholder: 'Part Name',
      },
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
      tab = <InventoryGroup tabInfo={tabInfo} />;
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
